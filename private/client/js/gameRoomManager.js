// gameRoomManager.js
export let socket;
export let myId = null;
export let hostId = null;
export const playerNames = new Map();

export function setMyId(id) {
    myId = id;
}

export function setHostId(id) {
    hostId = id;
}

const params = new URLSearchParams(location.search);
const name = params.get('name');
let roomId = params.get('room');

if (!name || !roomId) {
    alert('잘못된 접근입니다.');
    location.href = '/index.html';
}

// WebSocket 연결
socket = new WebSocket(`ws://${location.host}`);

socket.onopen = () => {
    const type = roomId === 'random' ? 'join_random' : 'join_room';
    const payload = roomId === 'random' ? { name } : { name, roomId };
    socket.send(JSON.stringify({ type, payload }));
};

// 기본 메시지 핸들러는 외부에서 등록
let messageHandler = null;
export function setMessageHandler(handler) {
    messageHandler = handler;
}

socket.onmessage = (event) => {
    if (messageHandler) {
        messageHandler(JSON.parse(event.data));
    }
};
