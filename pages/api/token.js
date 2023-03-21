// http://localhost:3000/api/token?UserID=1213
import commonFilter from "../../lib/filter";
const { generateToken04 } = require("../../lib/zegocloud_server_token_sdk");
if (!(process.env.ZEGOCLOUD_APP_ID && process.env.ZEGOCLOUD_SERVER_SECRET)) {
  throw new Error("You must define an APP_ID and SERVER_SECRET");
}
const APP_ID = process.env.ZEGOCLOUD_APP_ID;
const SERVER_SECRET = process.env.ZEGOCLOUD_SERVER_SECRET;

export default async function generateAccessToken(req, resp) {
  await commonFilter(req, resp);
  let expiredTs = req.query.expired_ts;
  if (!expiredTs) {
    expiredTs = 3600;
  }

  const UserID = req.query.UserID;
  if (!UserID) {
    return resp.status(500).json({ error: "UserID is required" });
  }

  let UserName = req.query.UserName;
  if (!UserName) {
    UserName = UserID;
  }

  const token = generateToken04(
    parseInt(APP_ID),
    UserID,
    SERVER_SECRET,
    parseInt(expiredTs),
    ""
  );

  return resp.json({
    token,
  });
}
