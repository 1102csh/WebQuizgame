const WebSocket = require("ws");
const gameRooms = require("./gameRooms");
const { getRandomQuiz } = require("./utils/quizUtil");
const { saveRanking } = require("./utils/rankingUtil");

const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

const clients = {};
const MAX_QUESTIONS = 5; // 한 게임당 문제 개수

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return Object.fromEntries(cookieHeader.split(";").map(c => {
        const [key, ...val] = c.trim().split("=");
        return [key, decodeURIComponent(val.join("="))];
    }));
}

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws, req) => {

        const cookies = parseCookies(req.headers.cookie || "");
        const token = cookies.token;

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            ws.user = decoded; // ✅ 유저 정보 저장 (예: { userId, username })
            console.log("✅ WebSocket 인증 성공:", decoded.username);
        } catch (err) {
            console.warn("❌ WebSocket 인증 실패: 연결 종료");
            return ws.close(); // 인증 실패 시 연결 종료
        }

        ws.on("message", async (message) => {
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
                    handleAnswer(data);
                    break;
            }
        });

        ws.on("close", () => {
            handleDisconnect(ws);
        });
    });
}

// 게임 시작 및 퀴즈 출제
async function handleGameStart(data) {
    const { roomId } = data;

    if (!gameRooms[roomId]) return;

    gameRooms[roomId].scoreboard = {}; // 점수판 초기화
    gameRooms[roomId].currentQuiz = await getRandomQuiz();
    gameRooms[roomId].answered = false;
    gameRooms[roomId].questionCount = 1; // 첫 번째 문제

    broadcast(roomId, {
        type: "quiz",
        question: gameRooms[roomId].currentQuiz.question,
        genre: gameRooms[roomId].currentQuiz.genre,
    });

    setTimeout(() => {
        if (!gameRooms[roomId]) return;

        broadcast(roomId, {
            type: "quizEnd",
            message: `정답은: ${gameRooms[roomId].currentQuiz.answers[0]} 입니다!`,
        });

        setTimeout(() => {
            handleNextQuestion(roomId);
        }, 3000);
    }, 30000);
}

// 정답 체크
function handleAnswer(data) {
    const { roomId, userId, message } = data;

    if (!gameRooms[roomId] || !gameRooms[roomId].currentQuiz) return;
    if (gameRooms[roomId].answered) return;

    const correctAnswers = gameRooms[roomId].currentQuiz.answers.map(ans => ans.trim().toLowerCase());
    if (correctAnswers.includes(message.trim().toLowerCase())) {
        gameRooms[roomId].answered = true;

        gameRooms[roomId].scoreboard[userId] = (gameRooms[roomId].scoreboard[userId] || 0) + 1;

        broadcast(roomId, {
            type: "correctAnswer",
            userId,
            message: `🎉 ${userId}님이 정답을 맞혔습니다!`,
        });

        setTimeout(() => {
            handleNextQuestion(roomId);
        }, 3000);
    }
}

// 다음 문제 출제
async function handleNextQuestion(roomId) {
    if (!gameRooms[roomId]) return;

    gameRooms[roomId].questionCount += 1;

    // 게임 종료 조건
    if (gameRooms[roomId].questionCount > MAX_QUESTIONS) {
        return handleGameEnd(roomId);
    }

    gameRooms[roomId].currentQuiz = await getRandomQuiz();
    gameRooms[roomId].answered = false;

    broadcast(roomId, {
        type: "quiz",
        question: gameRooms[roomId].currentQuiz.question,
        genre: gameRooms[roomId].currentQuiz.genre,
    });

    setTimeout(() => {
        broadcast(roomId, {
            type: "quizEnd",
            message: `정답은: ${gameRooms[roomId].currentQuiz.answers[0]} 입니다!`,
        });

        setTimeout(() => {
            handleNextQuestion(roomId);
        }, 3000);
    }, 30000);
}

// 게임 종료
function handleGameEnd(roomId) {
    if (!gameRooms[roomId]) return;

    const scoreboard = gameRooms[roomId].scoreboard;
    const sortedScores = Object.entries(scoreboard).sort((a, b) => b[1] - a[1]);
    const winner = sortedScores.length > 0 ? sortedScores[0][0] : "없음";

    broadcast(roomId, {
        type: "gameEnd",
        message: "게임 종료!",
        scoreboard,
        winner,
    });

    // 게임방 삭제
    delete gameRooms[roomId];
}

function broadcast(roomId, message) {
    if (!gameRooms[roomId]) return;

    gameRooms[roomId].players.forEach((playerId) => {
        if (clients[playerId]) {
            clients[playerId].send(JSON.stringify(message));
        }
    });
}

function handleDisconnect(ws) {
    const userId = Object.keys(clients).find((key) => clients[key] === ws);
    if (!userId) return;

    let roomId = null;

    for (const [id, room] of Object.entries(gameRooms)) {
        if (room.players.has(userId)) { // ✅ Set 사용
            roomId = id;
            break;
        }
    }

    if (!roomId) return;

    gameRooms[roomId].players.delete(userId);

    if (gameRooms[roomId].players.size === 0) {
        delete gameRooms[roomId];
    }

    delete clients[userId];

    // ✅ 모든 플레이어에게 업데이트 전송
    updatePlayerList(roomId);

    console.log(`🚪 사용자 ${userId} 연결 종료 (방 ID: ${roomId})`);
}

// ✅ 플레이어가 방에 입장할 때 처리
function handleJoin(ws, data) {
    const { roomId, userId } = data;

    if (!gameRooms[roomId]) return ws.send(JSON.stringify({ type: "error", message: "방을 찾을 수 없습니다." }));
    if (!userId) return ws.send(JSON.stringify({ type: "error", message: "인증 실패"}));

    gameRooms[roomId].players.add(userId);
    clients[userId] = ws;

    console.log(`✅ ${userId}가 ${roomId} 방에 입장함.`);

    // ✅ 참여자 목록을 갱신하여 모든 사람에게 전송
    updatePlayerList(roomId);
}

// ✅ 플레이어가 방에서 나갈 때 처리
function handleLeave(ws, data) {
    const { roomId, userId } = data;

    if (!gameRooms[roomId]) return;

    // ✅ Set에서 정확한 userId 삭제
    gameRooms[roomId].players.delete(userId);

    if (gameRooms[roomId].players.size === 0) {
        delete gameRooms[roomId]; // 모든 플레이어가 나가면 방 삭제
    }

    delete clients[userId];

    // 모든 플레이어에게 방 정보 갱신 전송
    updatePlayerList(roomId);
}

// ✅ 모든 클라이언트에게 방 참여자 목록 업데이트 전송
function updatePlayerList(roomId) {
    if (!gameRooms[roomId]) return;

    const playerList = Array.from(gameRooms[roomId].players).map((playerId) => ({
        userId: playerId,
        score: gameRooms[roomId].scoreboard ? gameRooms[roomId].scoreboard[playerId] || 0 : 0,
    }));

    console.log(`📤 ${roomId} 방의 새로운 참여자 목록:`, playerList);

    broadcast(roomId, {
        type: "updatePlayers",
        players: [...gameRooms[roomId].players].map(id => ({
            userId: id,
            score: gameRooms[roomId].scoreboard?.[id] || 0
        })),
        hostId: gameRooms[roomId].hostId // ✅ 이거 포함 필요!
    });
}

module.exports = setupWebSocket;
