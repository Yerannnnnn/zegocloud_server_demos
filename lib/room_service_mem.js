const crypto = require("crypto");
const request = require("request");

const ZEGO_APP_ID = process.env.ZEGOCLOUD_APP_ID;
const ZEGO_SERVER_SECRET = process.env.ZEGOCLOUD_SERVER_SECRET;
const HEARTBEAT_TIMEOUT =  90 * 100;

if (!(ZEGO_APP_ID && ZEGO_SERVER_SECRET)) {
  throw new Error("You must set your ZEGOCLOUD_APP_ID and ZEGOCLOUD_SERVER_SECRET");
}


const _roomList = {};

async function _createRoom(RoomID, RoomName, HostID) {
  try {
    if (_roomList[RoomID]) {
      return {
        "code": 1,
        "message": "room already exists",
      };
    } else {
      _roomList[RoomID] = {
        "room_id": RoomID,
        "room_name": RoomName,
        "host_id": HostID,
        "users": {},
      };
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
    if (_roomList[RoomID]) {
      delete _roomList[RoomID];
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
    const roomList = Object.values(_roomList).map((room) => {
      return {
        room_id: room.room_id,
        room_name: room.room_name,
        host_id: room.host_id,
      };
    });
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
    if (!_roomList[RoomID]) {
      return {
        "code": 1,
        "message": "room not exists",
      };
    }

    const room = _roomList[RoomID];
    if (room.users && room.users[UserID]) {
      return {
        "code": 1,
        "message": "user already joined",
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

    return {
      "code": 0,
      "message": "success",
    };
  } catch (err) {
    console.error(err);
    return {
      "code": 1,
      "message": "join room failed",
    };
  }
}

async function _leaveRoom(RoomID, UserID) {
  try {
    if (!_roomList[RoomID]) {
      return {
        "code": 1,
        "message": "room not exists",
      };
    }

    const room = _roomList[RoomID];
    if (!room.users || !room.users[UserID]) {
      return {
        "code": 1,
        "message": "user not exists in room",
      };
    }

    delete room.users[UserID];

    return {
      "code": 0,
      "message": "success",
    };
  } catch (err) {
    console.error(err);
    return {
      "code": 1,
      "message": "leave room failed",
    };
  }
}

async function _getRoomUserList(RoomID) {
  try {
    if (!_roomList[RoomID]) {
      return {
        "code": 1,
        "message": "room not exists",
      };
    }

    const room = _roomList[RoomID];
    const userList = room.users ? Object.values(room.users) : [];

    return {
      "code": 0,
      "message": "success",
      "data": userList,
    };
  } catch (err) {
    console.error(err);
    return {
      "code": 1,
      "message": "get user list failed",
    };
  }
}


async function _heartbeat(RoomID, UserID) {
  try {
    if (!_roomList[RoomID]) {
      return {
        "code": 1,
        "message": "room not exists",
      };
    }

    const room = _roomList[RoomID];

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


async function _checkHeartbeatTime() {
  try {
    const keys = Object.keys(_roomList);
    await Promise.all(keys.map(async (key) => {
      const room = _roomList[key];
      const users = room.users;
      const expiredUserIDs = Object.keys(users).filter(function (userID) {
          const now = Date.now();
          const userhb = users[userID].heartbeat_time;
          console.log(`now: ${now}, userhb: ${userhb}, diff: ${now - userhb}`);
          return now - userhb > HEARTBEAT_TIMEOUT;
        });
      if (expiredUserIDs.length > 0) {
        expiredUserIDs.forEach((userID) => {
          console.log('mem: User ${userID} has been removed from room ${room.room_id}');
          delete users[userID];
        });
        _roomList[room.room_id] = room;
      } else {
        // console.log('mem: timeout userList is empty');
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

setInterval(() => {
  _checkHeartbeatTime();
}, HEARTBEAT_TIMEOUT/3*2);



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
