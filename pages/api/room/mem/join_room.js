// http://localhost:3000/api/room/join_room?RoomID=room1&UserID=user1&UserName=user1

import commonFilter from "../../../../lib/filter";
import { _joinRoom } from "../../../../lib/room_service_mem";

export default async function joinRoom(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const RoomID = req.query.RoomID;
  const UserID = req.query.UserID;
  const UserName = req.query.UserName;
  const body = await _joinRoom(RoomID,UserID,UserName);
  return resp.json(body);
}
