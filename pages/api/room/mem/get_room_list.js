// http://localhost:3000/api/room/get_room_list?PageIndex=1&PageSize=200

import commonFilter from "../../../../lib/filter";
import { _getRoomList } from "../../../../lib/room_service_mem";

export default async function getRoomList(req, resp) {
  await commonFilter(req, resp);
  // set default query params
  const body = await _getRoomList();
  return resp.json(body);
}
