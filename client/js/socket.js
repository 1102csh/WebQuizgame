// WebSocket 전역 객체 생성
const socket = new WebSocket(`ws://${window.location.host}`);

// ✅ 페이지 URL에서 방 ID 추출
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

// ✅ 서버 연결 성공 시
socket.onopen = () => {
    console.log("✅ 서버 연결 성공!");
    
    const leftRoom = sessionStorage.getItem("leftRoom");
    if (leftRoom === "true") return;

    if (roomId) {
        socket.send(JSON.stringify({
            type: "join",
            roomId
            // ✅ userId는 서버에서 JWT 기반으로 자동 추출
        }));
    }
};

// 서버 연결 오류
socket.onerror = (error) => {
    console.error("🚨 WebSocket 오류:", error);
};

// 연결 종료 처리
socket.onclose = (event) => {
    console.warn("⚠️ WebSocket 연결 종료", event);

    if (event.code === 4001 || event.code === 4002) {
        alert("로그인 후 이용 가능합니다.");
        window.location.href = "/html/auth.html";
    }
};

// ✅ 페이지 종료 시 leave 이벤트 전송
window.addEventListener("beforeunload", () => {
    if (roomId) {
        socket.send(JSON.stringify({
            type: "leave",
            roomId
        }));
    }

    sessionStorage.setItem("leftRoom", "true");
    socket.close();
});

// ✅ 메시지 핸들러 배열
const messageHandlers = [];

socket.addEventListener("message", (event) => {
    try {
        const data = JSON.parse(event.data);
        messageHandlers.forEach(handler => handler(data));
    } catch (error) {
        console.error("🚨 JSON 파싱 오류:", error);
    }
});

// ✅ 핸들러 등록
export function addMessageHandler(handler) {
    messageHandlers.push(handler);
}

// ✅ 메시지 전송 함수
export function sendMessage(type, payload = {}) {
    if (roomId) {
        socket.send(JSON.stringify({
            type,
            roomId,
            ...payload
        }));
    }
}

export default socket;
