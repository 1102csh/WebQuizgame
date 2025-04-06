const gameRooms = require("../gameRooms");
const { v4: uuidv4 } = require("uuid"); // 랜덤 ID 생성

const jwt = require("jsonwebtoken");
require("dotenv").config();

class GameController {
  // 방 생성
  static createRoom(req, res) {
    const authHeader = req.headers.cookie;

    if (!authHeader) {
      return res.status(401).json({ message: "로그인 후 이용 가능합니다." });
    }

    const token = authHeader
      .split(";")
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return res.status(401).json({ message: "토큰이 없습니다." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const {
        title,
        maxPlayers,
        isPrivate,
        password,
        genres,
        timeLimit,
        quizCount
      } = req.body;

      const roomId = uuidv4();
      gameRooms[roomId] = {
        title,
        maxPlayers,
        isPrivate,
        password,
        genres,
        timeLimit,
        quizCount,
        players: new Set(),
        hostId: userId,
        scoreboard: {},
      };

      return res.status(201).json({ message: "방 생성 완료", roomId });
    } catch (err) {
      return res.status(401).json({ message: "토큰 검증 실패: " + err.message });
    }
  }

  // 방 목록 조회
  static getRooms(req, res) {
    const roomsList = Object.keys(gameRooms).map((roomId, index) => ({
      roomId,
      title: gameRooms[roomId].title,
      maxPlayers: gameRooms[roomId].maxPlayers,
      currentPlayers: gameRooms[roomId].players.size,
      roomNumber: index + 1,
    }));

    res.json(roomsList);
  }

  // 개별 방 정보 조회
  static getRoomInfo(req, res) {
    const { roomId } = req.params;
    const room = gameRooms[roomId];

    if (!room) {
      return res.status(404).json({ message: "방을 찾을 수 없습니다." });
    }

    res.json({
      roomId,
      title: room.title,
      roomNumber: Object.keys(gameRooms).indexOf(roomId) + 1,
      hostId: room.hostId,
      isPrivate: room.isPrivate,
      genres: room.genres,
      timeLimit: room.timeLimit,
      quizCount: room.quizCount,
      players: [...room.players].map((player) => ({
        userId: player,
        score: room.scoreboard?.[player] || 0
      }))
    });
  }

  // 방에 입장
  static joinRoom(req, res) {
    const authHeader = req.headers.cookie;

    if (!authHeader) {
      return res.status(401).json({ message: "로그인 후 이용 가능합니다." });
    }

    const token = authHeader
      .split(";")
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return res.status(401).json({ message: "토큰이 없습니다." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const { roomId } = req.body;
      const room = gameRooms[roomId];

      if (!room) {
        return res.status(404).json({ message: "방을 찾을 수 없습니다." });
      }
      if (room.players.size >= room.maxPlayers) {
        return res.status(400).json({ message: "방이 가득 찼습니다." });
      }

      room.players.add(userId);
      res.json({ message: "방 입장 성공!", room });
    } catch (err) {
      return res.status(401).json({ message: "토큰 검증 실패: " + err.message });
    }
  }

  // 방에서 나가기
  static leaveRoom(req, res) {
    const { roomId, userId } = req.body;
    const room = gameRooms[roomId];

    if (!room) {
      return res.status(404).json({ message: "방을 찾을 수 없습니다." });
    }

    room.players.delete(userId);

    if (room.players.size === 0) {
      delete gameRooms[roomId];
    }

    res.json({ message: "방에서 나갔습니다." });
  }

  // 빠른 입장
  static quickJoin(req, res) {
    const authHeader = req.headers.cookie;

    if (!authHeader) {
      return res.status(401).json({ message: "로그인 후 이용 가능합니다." });
    }

    const token = authHeader
      .split(";")
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return res.status(401).json({ message: "토큰이 없습니다." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const availableRoom = Object.keys(gameRooms).find(
        roomId => gameRooms[roomId].players.size < gameRooms[roomId].maxPlayers
      );

      if (!availableRoom) {
        return res.status(404).json({ message: "입장 가능한 방이 없습니다." });
      }

      gameRooms[availableRoom].players.add(userId);
      res.json({ message: "빠른 입장 성공!", roomId: availableRoom });
    } catch (err) {
      return res.status(401).json({ message: "토큰 검증 실패: " + err.message });
    }
  }
}

module.exports = GameController;
