// http://localhost:3000/api/room/create_room?RoomID=room1&RoomName=room1&HostID=host1

import commonFilter from "../../../../lib/filter";
import { _checkHeartbeatTime } from "../../../../lib/room_service_redis";

export default async function checkHeartbeatTime(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const RoomID = req.query.RoomID;
  const UserID = req.query.UserID;
  const body = await _checkHeartbeatTime(RoomID,UserID);
  return resp.json(body);
}
