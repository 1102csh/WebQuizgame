const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./roomManager');
const GameManager = require('./gameManager');

const rooms = {}; // 방 ID -> RoomManager 인스턴스

module.exports = function socketHandler(ws, wss) {
    ws.id = uuidv4(); // 각 클라이언트에 고유 ID 부여
    ws.roomId = null;

    ws.on('message', async (msg) => {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (err) {
            console.error('잘못된 메시지 형식:', msg);
            return;
        }

        const { type, payload } = data;

        switch (type) {
            case 'create_room':
                handleCreateRoom(ws, payload);
                break;
            case 'join_random':
                handleJoinRandom(ws, payload);
                break;
            case 'join_room':
                handleJoinRoom(ws, payload);
                break;
            case 'chat':
                handleChat(ws, payload);
                break;
            case 'start_game':
                handleStartGame(ws);
                break;
            case 'answer':
                handleAnswer(ws, payload);
                break;
            default:
                console.log('알 수 없는 메시지 타입:', type);
        }
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });
};

function handleCreateRoom(ws, payload) {
    const code = generateUniqueRoomCode();
    ws.roomId = code;
    if (!rooms[code]) rooms[code] = new RoomManager(code);
    rooms[code].addPlayer(ws, payload.name);
}
function handleJoinRandom(ws, payload) {
    const available = Object.entries(rooms).find(([id, room]) => room.players.length < 8);
    if (available) {
        const [roomId, room] = available;
        ws.roomId = roomId;
        room.addPlayer(ws, payload.name);
    } else {
        // 방이 없으면 새로 생성
        const newCode = generateUniqueRoomCode();
        ws.roomId = newCode;
        rooms[newCode] = new RoomManager(newCode);
        rooms[newCode].addPlayer(ws, payload.name);
    }
}
function handleJoinRoom(ws, payload) {
    if (!payload) return;

    const name = payload.name;
    const roomId = payload.roomId;

    if (!rooms[roomId]) {
        rooms[roomId] = new RoomManager(roomId);
    }

    const room = rooms[roomId];
    ws.roomId = roomId;

    room.addPlayer(ws, name); // 이 시점에 ws.id가 이미 설정되어 있어야 함

    room.broadcastPlayerList();
}
async function handleChat(ws, payload) {
    const text = payload?.text?.trim();
    if (!text) return;

    const room = rooms[ws.roomId];
    const game = room?.game;
    const playerInfo = room.playersById.get(ws.id);
    const playerName = playerInfo?.name || '익명';

    if (game && !game.answered) {
        const isCorrect = await game.checkAnswer(ws, text);
        if (isCorrect) return; // 정답이면 여기서 처리 끝
    }

    // ❗ 틀렸거나 아직 정답 아님 → 그냥 채팅으로 broadcast
    room.broadcast('chat_message', {
        sender: playerName,
        message: text
    });
}
function handleStartGame(ws) {
    const room = rooms[ws.roomId];
    if (!room || !room.isHost(ws)) return;

    room.startGame();
}
function handleAnswer(ws, { answer }) {
    const room = rooms[ws.roomId];
    if (!room || !room.game) return;

    room.game.checkAnswer(ws, answer);
}
function handleDisconnect(ws) {
    const room = rooms[ws.roomId];
    if (!room) return;

    room.removePlayer(ws);

    // 방이 비면 삭제
    if (room.isEmpty()) {
        delete rooms[ws.roomId];
    } else {
        room.broadcastPlayerList();
    }
}

// 코드 생성용
function generateUniqueRoomCode(length = 5) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
