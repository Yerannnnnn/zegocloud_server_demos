// http://localhost:3000/api/room/create_room?RoomID=room1&RoomName=room1&HostID=host1

import commonFilter from "../../../../lib/filter";
import { _createRoom } from "../../../../lib/room_service_mem";

export default async function createRoom(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const RoomID = req.query.RoomID;
  const RoomName = req.query.RoomName;
  const HostID = req.query.HostID;
  const body = await _createRoom(RoomID,RoomName,HostID);
  return resp.json(body);
}
