const WebSocket = require("ws");
const gameRooms = require("./gameRooms");

const clients = {}; // WebSocket 클라이언트 목록

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    console.log("새로운 WebSocket 연결이 수립되었습니다.");

    ws.on("message", (message) => {
      console.log("새로운 데이터 수신 : ",message);
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
          console.log("수신");
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

  if (!gameRooms[roomId]) {
    ws.send(JSON.stringify({ type: "error", message: "방을 찾을 수 없습니다." }));
    return;
  }

  gameRooms[roomId].players.push(userId);
  clients[userId] = ws;

  broadcast(roomId, {
    type: "userJoined",
    userId,
    username,
    message: `${username}님이 입장했습니다.`,
  });
}

function handleLeave(ws, data) {
  const { roomId, userId, username } = data;

  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players = gameRooms[roomId].players.filter((id) => id !== userId);

  if (gameRooms[roomId].players.length === 0) {
    delete gameRooms[roomId]; // 모든 플레이어가 나가면 방 삭제
  }

  delete clients[userId];

  broadcast(roomId, {
    type: "userLeft",
    userId,
    username,
    message: `${username}님이 퇴장했습니다.`,
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

function handleDisconnect(ws) {
  const userId = Object.keys(clients).find((key) => clients[key] === ws);
  if (userId) {
    delete clients[userId];
  }
}

function broadcast(roomId, message) {
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players.forEach((playerId) => {
    if (clients[playerId]) {
      clients[playerId].send(JSON.stringify(message));
    }
  });
}

module.exports = setupWebSocket;
