const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const gameRooms = require("./gameRooms");
const { getRandomQuiz } = require("./utils/quizUtil");
const { saveRanking } = require("./utils/rankingUtil");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const clients = {}; // userId -> ws
const MAX_QUESTIONS = 5;

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [key, ...val] = c.trim().split("=");
      return [key, decodeURIComponent(val.join("="))];
    })
  );
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      ws.close(4001, "토큰이 없습니다.");
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      ws.user = decoded; // userId, username 저장
      clients[decoded.userId] = ws;
      console.log(`✅ WebSocket 인증 성공: ${decoded.username}`);
    } catch (err) {
      console.error("❌ 인증 실패:", err.message);
      ws.close(4002, "인증 실패");
      return;
    }

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      const { type } = data;

      switch (type) {
        case "join": return handleJoin(ws, data);
        case "leave": return handleLeave(ws, data);
        case "chat": return handleChat(data);
        case "startGame": return handleGameStart(data);
        case "answer": return handleAnswer(data);
      }
    });

    ws.on("close", () => {
      handleDisconnect(ws);
    });
  });
}

// ✅ join 처리
function handleJoin(ws, { roomId }) {
  const { userId, username } = ws.user;
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players.add(userId);
  clients[userId] = ws;

  console.log(`✅ ${userId} (${username})가 ${roomId} 방에 입장함.`);
  updatePlayerList(roomId);

  broadcast(roomId, {
    type: "chat",
    userId: "SYSTEM",
    message: `${username}님이 입장했습니다.`,
  });
}

// ✅ leave 처리
function handleLeave(ws, { roomId }) {
  const { userId, username } = ws.user;
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players.delete(userId);
  delete clients[userId];

  if (gameRooms[roomId].players.size === 0) {
    delete gameRooms[roomId];
    return;
  }

  // 방장 재선정
  if (gameRooms[roomId].hostId === userId) {
    const [newHost] = gameRooms[roomId].players;
    gameRooms[roomId].hostId = newHost;
    console.log(`👑 ${newHost}가 새 방장이 되었습니다.`);
  }

  updatePlayerList(roomId);

  broadcast(roomId, {
    type: "chat",
    userId: "SYSTEM",
    message: `${username}님이 퇴장했습니다.`,
  });
}

// ✅ 채팅 처리
function handleChat({ roomId, message }, userId = null) {
  if (!gameRooms[roomId]) return;

  broadcast(roomId, {
    type: "chat",
    userId: userId || "SYSTEM",
    message,
  });
}

// ✅ 게임 시작
async function handleGameStart({ roomId }) {
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].scoreboard = {};
  gameRooms[roomId].questionCount = 1;
  gameRooms[roomId].answered = false;

  const quiz = await getRandomQuiz();
  gameRooms[roomId].currentQuiz = quiz;

  broadcast(roomId, {
    type: "quiz",
    genre: quiz.genre,
    question: quiz.question,
  });

  setTimeout(() => {
    endQuestion(roomId);
  }, 30000);
}

// ✅ 정답 확인
function handleAnswer({ roomId, message }, ws) {
  const userId = ws.user?.userId;
  if (!userId || !gameRooms[roomId]) return;

  const quiz = gameRooms[roomId].currentQuiz;
  if (!quiz || gameRooms[roomId].answered) return;

  const correctAnswers = quiz.answers.map(ans => ans.trim().toLowerCase());
  if (correctAnswers.includes(message.trim().toLowerCase())) {
    gameRooms[roomId].answered = true;

    gameRooms[roomId].scoreboard[userId] = (gameRooms[roomId].scoreboard[userId] || 0) + 1;

    broadcast(roomId, {
      type: "correctAnswer",
      userId,
      message: `🎉 ${userId}님이 정답을 맞혔습니다!`,
    });

    setTimeout(() => {
      nextQuestion(roomId);
    }, 3000);
  }
}

// ✅ 문제 끝내기
function endQuestion(roomId) {
  const quiz = gameRooms[roomId]?.currentQuiz;
  if (!quiz) return;

  broadcast(roomId, {
    type: "quizEnd",
    message: `정답은 ${quiz.answers[0]}입니다.`,
  });

  setTimeout(() => {
    nextQuestion(roomId);
  }, 3000);
}

// ✅ 다음 문제
async function nextQuestion(roomId) {
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].questionCount += 1;
  if (gameRooms[roomId].questionCount > MAX_QUESTIONS) {
    return endGame(roomId);
  }

  const quiz = await getRandomQuiz();
  gameRooms[roomId].currentQuiz = quiz;
  gameRooms[roomId].answered = false;

  broadcast(roomId, {
    type: "quiz",
    genre: quiz.genre,
    question: quiz.question,
  });

  setTimeout(() => {
    endQuestion(roomId);
  }, 30000);
}

// ✅ 게임 종료
function endGame(roomId) {
  const scoreboard = gameRooms[roomId].scoreboard || {};
  const sorted = Object.entries(scoreboard).sort((a, b) => b[1] - a[1]);
  const winner = sorted.length ? sorted[0][0] : "없음";

  broadcast(roomId, {
    type: "gameEnd",
    message: "게임 종료!",
    scoreboard,
    winner,
  });

  delete gameRooms[roomId];
}

// ✅ 플레이어 목록 전송
function updatePlayerList(roomId) {
  if (!gameRooms[roomId]) return;

  const players = Array.from(gameRooms[roomId].players).map(id => ({
    userId: id,
    score: gameRooms[roomId].scoreboard?.[id] || 0,
  }));

  broadcast(roomId, {
    type: "updatePlayers",
    players,
    hostId: gameRooms[roomId].hostId,
  });
}

// ✅ 퇴장 처리
function handleDisconnect(ws) {
  const userId = ws.user?.userId;
  if (!userId) return;

  delete clients[userId];

  for (const roomId in gameRooms) {
    if (gameRooms[roomId].players.has(userId)) {
      handleLeave(ws, { roomId });
      break;
    }
  }
}

// ✅ 메시지 브로드캐스트
function broadcast(roomId, message) {
  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players.forEach((userId) => {
    const ws = clients[userId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

module.exports = setupWebSocket;
