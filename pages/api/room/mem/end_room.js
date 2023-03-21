// http://localhost:3000/api/room/end_room?RoomID=room1

import commonFilter from "../../../../lib/filter";
import { _endRoom } from "../../../../lib/room_service_mem";

export default async function endRoom(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const RoomID = req.query.RoomID;
  const body = await _endRoom(RoomID);
  return resp.json(body);
}
