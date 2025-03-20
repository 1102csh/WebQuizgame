const WebSocket = require("ws");
const gameRooms = require("./gameRooms");

const clients = {}; // WebSocket 클라이언트 목록

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    console.log("새로운 WebSocket 연결이 수립되었습니다.");

    ws.on("message", (message) => {
      const data = JSON.parse(message);

      switch (data.type) {
        case "join":
          handleJoin(ws, data);
          break;
        case "leave":
          handleLeave(ws, data);
          break;
        case "chat":
          handleChat(data);
          break;
        case "startGame":
          handleGameStart(data);
          break;
        case "answer":
          handleAnswer(ws, data);
          break;
      }
    });

    ws.on("close", () => {
      console.log("클라이언트 연결이 종료되었습니다.");
      handleDisconnect(ws);
    });
  });
}

function handleJoin(ws, data) {
  const { roomId, userId, username } = data;

  if (!gameRooms[roomId]) return ws.send(JSON.stringify({ type: "error", message: "방을 찾을 수 없습니다." }));

  // ✅ 중복 방지를 위해 Set을 사용
  gameRooms[roomId].players.add(userId);
  clients[userId] = ws;

  console.log(`✅ ${userId}가 ${roomId} 방에 입장함.`); // 디버깅 로그 추가

  // ✅ 참여자 목록을 갱신하여 모든 사람에게 전달
  broadcastPlayerList(roomId);

  // ✅ 채팅창에 입장 메시지 출력
  broadcast(roomId, {
    type: "chat",
    userId: "SYSTEM",
    message: `${username || userId}님이 입장하셨습니다.`,
  });
}

function handleLeave(ws, data) {
  const { roomId, userId, username } = data;

  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players.delete(userId);

  if (gameRooms[roomId].players.size === 0) {
    delete gameRooms[roomId]; // 모든 플레이어가 나가면 방 삭제
  }

  delete clients[userId];

  console.log(`🚪 ${userId}가 ${roomId} 방에서 나감.`); // 디버깅 로그 추가

  // ✅ 남아있는 플레이어 목록을 업데이트
  broadcastPlayerList(roomId);

  // ✅ 채팅창에 퇴장 메시지 출력
  broadcast(roomId, {
    type: "chat",
    userId: "SYSTEM",
    message: `${username || userId}님이 퇴장하셨습니다.`,
  });
}

function handleChat(data) {
  const { roomId, userId, message } = data;

  broadcast(roomId, {
    type: "chat",
    userId,
    message,
  });
}

function handleGameStart(data) {
  const { roomId } = data;

  if (!gameRooms[roomId]) return;

  broadcast(roomId, {
    type: "gameStarted",
    message: "게임이 시작되었습니다!",
  });
}

function handleAnswer(ws, data) {
  const { roomId, userId, message } = data;

  if (!gameRooms[roomId]) return;
  if (!message || message.trim() === "") return; // 빈 메시지 방지

  console.log(`✅ 정답 메시지 수신 - ${userId}: ${message}`);

  broadcast(roomId, {
    type: "answer",
    userId,
    message,
  });
}

function handleDisconnect(ws) {
  const userId = Object.keys(clients).find((key) => clients[key] === ws);
  if (userId) {
    delete clients[userId];
  }
}

function broadcastPlayerList(roomId) {
  if (!gameRooms[roomId]) return;

  const playerList = [...gameRooms[roomId].players].map((playerId) => ({
    userId: playerId,
    score: gameRooms[roomId].scoreboard ? gameRooms[roomId].scoreboard[playerId] || 0 : 0,
  }));

  console.log(`📤 ${roomId} 방의 새로운 플레이어 목록 전송:`, playerList); // 디버깅 로그 추가

  broadcast(roomId, {
    type: "updatePlayers",
    players: playerList,
  });
}

function broadcast(roomId, message) {
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players.forEach((playerId) => {
    const client = clients[playerId];
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    } else {
      console.warn(`⚠️ 서버가 닫혀 있어 ${playerId}에게 메시지를 전송하지 못함.`);
    }
  });
}

module.exports = setupWebSocket;
