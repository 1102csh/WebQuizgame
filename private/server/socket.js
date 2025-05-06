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

function handleJoinRoom(ws, { name }) {
    if (!name) return;

    const roomId = 'default'; // 또는 UUID 등
    if (!rooms[roomId]) {
        rooms[roomId] = new RoomManager(roomId);
    }

    const room = rooms[roomId];
    room.addPlayer(ws, name);

    ws.roomId = roomId;
    room.broadcastPlayerList();
}
function handleChat(ws, { message }) {
    const room = rooms[ws.roomId];
    if (!room) return;

    room.broadcast('chat', {
        playerId: ws.id,
        message
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
