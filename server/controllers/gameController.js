const gameRooms = require("../gameRooms");
const { v4: uuidv4 } = require("uuid"); // 랜덤 ID 생성

class GameController {
  // 방 생성
  static createRoom(req, res) {
    const { title, maxPlayers, hostId } = req.body;

    if (!title || !maxPlayers || !hostId) {
      return res.status(400).json({ message: "모든 필드를 입력하세요." });
    }

    const roomId = uuidv4();

    // ✅ Set을 사용하여 중복 추가 방지
    gameRooms[roomId] = {
      title,
      maxPlayers,
      hostId,
      players: new Set([hostId]), // ✅ 중복되지 않도록 Set 사용
      scoreboard: {},
    };

    res.status(201).json({ message: "방 생성 성공!", roomId });
  }

  // ✅ 1️⃣ 방 목록 조회 API (복구)
  static getRooms(req, res) {
    const roomsList = Object.keys(gameRooms).map((roomId, index) => ({
        roomId,
        title: gameRooms[roomId].title,
        maxPlayers: gameRooms[roomId].maxPlayers,
        currentPlayers: gameRooms[roomId].players.size, // ✅ Set에서는 size 사용
        roomNumber: index + 1, // 방 번호 (1부터 시작)
    }));

    res.json(roomsList);
  }

  // ✅ 2️⃣ 개별 방 정보 조회 API (유지)
  static getRoomInfo(req, res) {
    const { roomId } = req.params;
    const room = gameRooms[roomId];

    if (!room) {
      return res.status(404).json({ message: "방을 찾을 수 없습니다." });
    }

    res.json({
      roomId,
      title: room.title,
      roomNumber: Object.keys(gameRooms).indexOf(roomId) + 1, // 방 번호 (1부터 시작)
      players: [...room.players].map((player) => ({ // ✅ Set을 배열로 변환
        userId: player,
        score: room.scoreboard ? room.scoreboard[player] || 0 : 0, // 점수 정보 추가
      })),
    });
  }

  // 방에 입장
  static joinRoom(req, res) {
    const { roomId, userId } = req.body;
    const room = gameRooms[roomId];

    if (!room) {
      return res.status(404).json({ message: "방을 찾을 수 없습니다." });
    }
    if (room.players.size >= room.maxPlayers) {
      return res.status(400).json({ message: "방이 가득 찼습니다." });
    }

    // ✅ Set을 사용하여 중복 추가 방지
    room.players.add(userId);

    res.json({ message: "방 입장 성공!", room });
  }

  // 방에서 나가기
  static leaveRoom(req, res) {
    const { roomId, userId } = req.body;
    const room = gameRooms[roomId];

    if (!room) {
      return res.status(404).json({ message: "방을 찾을 수 없습니다." });
    }

    room.players = room.players.filter(id => id !== userId);

    // 모든 사람이 나가면 방 삭제
    if (room.players.length === 0) {
      delete gameRooms[roomId];
    }

    res.json({ message: "방에서 나갔습니다." });
  }

  // 빠른 입장 (빈 자리가 있는 방 중 하나에 배정)
  static quickJoin(req, res) {
    const availableRoom = Object.keys(gameRooms).find(
      roomId => gameRooms[roomId].players.length < gameRooms[roomId].maxPlayers
    );

    if (!availableRoom) {
      return res.status(404).json({ message: "입장 가능한 방이 없습니다." });
    }

    gameRooms[availableRoom].players.push(req.body.userId);
    res.json({ message: "빠른 입장 성공!", roomId: availableRoom });
  }
}

module.exports = GameController;