const express = require("express");
const GameController = require("../controllers/gameController");

const router = express.Router();

router.post("/create", GameController.createRoom); // 방 생성
router.get("/rooms", GameController.getRooms); // 방 목록 조회
router.get("/room/:roomId", GameController.getRoomInfo); // ✅ 개별 방 정보 조회
router.post("/join", GameController.joinRoom); // 방 입장
router.post("/leave", GameController.leaveRoom); // 방 나가기
router.post("/quick-join", GameController.quickJoin); // 빠른 입장

module.exports = router;
