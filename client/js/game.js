import socket from "./socket.js";
import { sendAnswer } from "./socket.js";
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

window.sendAnswer = sendAnswer; // 전역등록

// ✅ localStorage를 사용하여 userId 중복 방지
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = `player_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem("userId", userId);
}

socket.onopen = () => {
    console.log("WebSocket 연결 성공!");

    // 방 입장 메시지 전송
    socket.send(JSON.stringify({
        type: "join",
        roomId,
        userId
    }));
};

// 서버에서 받은 메시지를 처리
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "updatePlayers") {
        displayPlayers(data.players);
    }
};

// ✅ 플레이어 목록 업데이트 함수
function displayPlayers(players) {
    const playerList = document.getElementById("player-list");
    playerList.innerHTML = "";

    players.forEach(player => {
        const playerElement = document.createElement("li");
        playerElement.textContent = `${player.userId} - ${player.score}점`;
        playerList.appendChild(playerElement);
    });
}

// ✅ 창이 닫힐 때 퇴장 메시지 전송
window.addEventListener("beforeunload", () => {
    socket.send(JSON.stringify({
        type: "leave",
        roomId,
        userId
    }));
    socket.close();
});

async function fetchRoomInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    try {
        const response = await fetch(`/api/game/room/${roomId}`);
        const roomData = await response.json();

        if (!response.ok) {
            alert(roomData.message);
            window.location.href = "/"; // 방이 없으면 로비로 이동
            return;
        }

        // 방 정보 표시
        document.getElementById("room-title").textContent = roomData.title;
        document.getElementById("room-number").textContent = `방 번호: ${roomData.roomNumber}`;

        // 플레이어 목록 표시
        displayPlayers(roomData.players);
    } catch (error) {
        console.error("방 정보 불러오기 오류:", error);
    }
}

console.log("완료");
document.addEventListener("DOMContentLoaded", fetchRoomInfo);
