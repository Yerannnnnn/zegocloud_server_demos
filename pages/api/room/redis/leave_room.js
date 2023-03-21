// http://localhost:3000/api/room/create_room?RoomID=room1&RoomName=room1&HostID=host1

import commonFilter from "../../../../lib/filter";
import { _leaveRoom } from "../../../../lib/room_service_redis";

export default async function leaveRoom(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const RoomID = req.query.RoomID;
  const UserID = req.query.UserID;
  const body = await _leaveRoom(RoomID,UserID);
  return resp.json(body);
}
