// http://localhost:3000/api/room/get_room_list?PageIndex=1&PageSize=200

import commonFilter from "../../../../lib/filter";
import { _getRoomUserList } from "../../../../lib/room_service_mem";

export default async function getRoomUserList(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const RoomID = req.query.RoomID;
  const body = await _getRoomUserList(RoomID);
  return resp.json(body);
}
