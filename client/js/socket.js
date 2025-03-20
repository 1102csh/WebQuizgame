// WebSocket 전역 객체 생성
const socket = new WebSocket(`ws://${window.location.host}`);

// ✅ localStorage를 사용하여 userId 중복 방지
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = `player_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem("userId", userId);
}

socket.onopen = () => {
    console.log("✅ 서버 연결 성공!");
    
    // 방 입장 메시지 전송
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    if (roomId) {
        socket.send(JSON.stringify({
            type: "join",
            roomId,
            userId
        }));
    }
};

socket.onerror = (error) => {
    console.error("🚨 서버 오류 발생:", error);
};

socket.onclose = () => {
    console.log("⚠️ 서버와 연결이 끊어졌습니다.");
};

// ✅ 페이지 종료 시 방 나가기 처리
window.addEventListener("beforeunload", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    if (roomId) {
        socket.send(JSON.stringify({
            type: "leave",
            roomId,
            userId
        }));
    }
    socket.close();
});

// ✅ 메시지 핸들러 등록 (다른 파일에서 사용할 수 있도록)
const messageHandlers = [];

socket.addEventListener("message", (event) => {
    try {
        const data = JSON.parse(event.data);
        //console.log("📩 서버에서 수신한 메시지:", data);

        // 등록된 모든 핸들러 실행
        messageHandlers.forEach((handler) => handler(data));
    } catch (error) {
        console.error("🚨 JSON 파싱 오류:", error);
    }
});

// ✅ 다른 파일에서 WebSocket 메시지를 처리할 수 있도록 핸들러 등록 기능 제공
export function addMessageHandler(handler) {
    messageHandlers.push(handler);
}

export function sendMessage(type, payload = {}) {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    if (roomId) {
        socket.send(JSON.stringify({ type, roomId, userId, ...payload }));
    }
}

export default socket;
