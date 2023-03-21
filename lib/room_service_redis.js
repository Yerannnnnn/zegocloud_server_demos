const crypto = require("crypto");
const Redis = require("ioredis");
const { promisify } = require("util");
const request = require("request");

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_USER = process.env.REDIS_USER;
const REDIS_PSWD = process.env.REDIS_PSWD;
const ZEGO_APP_ID = process.env.ZEGOCLOUD_APP_ID;
const ZEGO_SERVER_SECRET = process.env.ZEGOCLOUD_SERVER_SECRET;
const HEARTBEAT_TIMEOUT =  90 * 100;


if (!(ZEGO_APP_ID && ZEGO_SERVER_SECRET && REDIS_HOST&& REDIS_PORT &&  REDIS_USER && REDIS_PSWD)) {
  throw new Error("You must set your ZEGOCLOUD_APP_ID, ZEGOCLOUD_SERVER_SECRET and REDIS_HOST, REDIS_PORT, REDIS_USER, REDIS_PSWD environment variables.");
}

const client = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT ,
  username: REDIS_USER,
  password: REDIS_PSWD
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

client.on('error', (error) => {
  console.error(error);
});

client.on('connect', () => {
  console.log('Connected to Redis');
  setInterval(() => {
    _checkHeartbeatTime();
  }, HEARTBEAT_TIMEOUT/3*2);
});

    
async function _createRoom(RoomID, RoomName, HostID) {
  try {
    const existingRoom = await getAsync(RoomID);
    if (existingRoom) {
      return {
        "code": 1,
        "message": "room already exists",
      };
    } else {
      const room = {
        "room_id": RoomID,
        "room_name": RoomName,
        "host_id": HostID,
        "users": {},
      };
      await setAsync(RoomID, JSON.stringify(room));
      return {
        "code": 0,
        "message": "success",
      };
    }
  } catch (err) {
    console.error(err);
    return {
      "code": 1,
      "message": "create room failed",
    };
  }
}

async function _endRoom(RoomID) {
  try {
    const existingRoom = await getAsync(RoomID);
    if (existingRoom) {
      await delAsync(RoomID);
      return {
        "code": 0,
        "message": "success",
      };
    } else {
      return {
        "code": 1,
        "message": "room not exists",
      };
    }
  } catch (err) {
    console.error(err);
    return {
      "code": 1,
      "message": "end room failed",
    };
  }
}

async function _getRoomList() {
  try {
    const keys = await promisify(client.keys).bind(client)("*");
    const roomList = await Promise.all(
      keys.map(async (key) => {
        const roomStr = await getAsync(key);
        const room = JSON.parse(roomStr);
        return {
          room_id: room.room_id,
          room_name: room.room_name,
          host_id: room.host_id,
        };
      })
    );
    return {
      code: 0,
      message: "success",
      data: roomList,
    };
  } catch (err) {
    console.error(err);
    return {
      code: 1,
      message: "get room list failed",
    };
  }
}

async function _joinRoom(RoomID, UserID, UserName) {
  try {
    const roomString = await getAsync(RoomID);

    if (!roomString) {
      return {
        code: 1,
        message: "room not exists",
      };
    }

    const room = JSON.parse(roomString);

    if (room.users && room.users[UserID]) {
      return {
        code: 1,
        message: "user already joined",
      };
    }

    if (!room.users) {
      room.users = {};
    }

    const timestamp = new Date().getTime();
    room.users[UserID] = {
      "user_id": UserID,
      "user_name": UserName,
      "join_time": timestamp,
      "heartbeat_time": timestamp,
    };

    await setAsync(RoomID, JSON.stringify(room));

    return {
      code: 0,
      message: "join room success",
    };
  } catch (err) {
    console.error(err);
    return {
      code: 1,
      message: "join room failed",
    };
  }
}

async function _leaveRoom(RoomID, UserID) {
  try {
    const roomString = await getAsync(RoomID);

    if (!roomString) {
      return {
        code: 1,
        message: "room not exists",
      };
    }

    const room = JSON.parse(roomString);

    if (!room.users || !room.users[UserID]) {
      return {
        code: 1,
        message: "user not in room",
      };
    }

    delete room.users[UserID];

    await setAsync(RoomID, JSON.stringify(room));

    return {
      code: 0,
      message: "leave room success",
    };
  } catch (err) {
    console.error(err);
    return {
      code: 1,
      message: "leave room failed",
    };
  }
}

async function _getRoomUserList(RoomID) {
  try {
    const roomString = await getAsync(RoomID);

    if (!roomString) {
      return {
        code: 1,
        message: "room not exists",
        userList: [],
      };
    }

    const room = JSON.parse(roomString);
    const userList = Object.values(room.users || {});

    return {
      code: 0,
      message: "get user list success",
      userList,
    };
  } catch (err) {
    console.error(err);
    return {
      code: 1,
      message: "get user list failed",
      userList: [],
    };
  }
}

async function _heartbeat(RoomID, UserID) {
  try {
    const roomString = await getAsync(RoomID);

    if (!roomString) {
      return {
        code: 1,
        message: "room not exists",
      };
    }

    const room = JSON.parse(roomString);


    if (!room.users || !room.users[UserID]) {
      return {
        code: 1,
        message: "user not joined or heartbeat timeout",
      };
    }

    const now = new Date().getTime();
    const userhb = room.users[UserID].heartbeat_time;
    if (now - userhb > HEARTBEAT_TIMEOUT) {
      return {
        code: 1,
        message: "heartbeat timeout",
      };
    }

    room.users[UserID].heartbeat_time = now;

    await setAsync(RoomID, JSON.stringify(room));

    return {
      code: 0,
      message: "heartbeat success",
    };
  } catch (err) {
    console.error(err);
    return {
      code: 1,
      message: "heartbeat failed",
    };
  }
}


async function _checkHeartbeatTime(){
  try {
    const keys = await promisify(client.keys).bind(client)("*");
    await Promise.all(keys.map(async (key) => {
      const room = JSON.parse(await promisify(client.get).bind(client)(key));
      const users = room.users;
      const expiredUserIDs = Object.keys(users).filter(function (userID) {
          const now = Date.now();
          const userhb = users[userID].heartbeat_time;
          return (now - userhb) > HEARTBEAT_TIMEOUT;
        });
      if (expiredUserIDs.length > 0) {
        expiredUserIDs.forEach((userID) => {
          console.log(`redis: User ${userID} has been removed from room ${room.room_id}`);
          delete users[userID];
        });
        await promisify(client.set).bind(client)(room.room_id, JSON.stringify(room));
      }else{
        // console.log(`redis: timeout userList is empty`);
      }
    }));
    return {
      "code": 0,
      "message": "success",
    };
  } catch (err) {
    console.error(err);
    return {
      "code": 1,
      "message": err,
    };
  }
}




module.exports = {
  _createRoom,
  _endRoom,
  _getRoomList,
  _joinRoom,
  _leaveRoom,
  _getRoomUserList,
  _heartbeat,
  _checkHeartbeatTime,
};
