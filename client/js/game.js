import { addMessageHandler, sendMessage } from "./socket.js";
window.sendAnswer = sendAnswer; // 전역등록

// ✅ URL에서 roomId 가져오기
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");

// ✅ 게임 방 정보 가져오기
async function fetchRoomInfo() {
    try {
        const response = await fetch(`/api/game/room/${roomId}`);
        const roomData = await response.json();

        if (!response.ok) {
            alert(roomData.message);
            window.location.href = "/"; // 방이 없으면 로비로 이동
            return;
        }

        // 방 정보 표시
        document.getElementById("roomTitle").textContent = roomData.title;
        document.getElementById("roomNumber").textContent = `[${roomData.roomNumber}]`;

        // 플레이어 목록 표시
        displayPlayers(roomData.players);
    } catch (error) {
        console.error("방 정보 불러오기 오류:", error);
    }
}

// ✅ 정답 제출 함수
export function sendAnswer() {
    const answerInput = document.getElementById("answerInput");
    if (!answerInput) return;

    const answer = answerInput.value.trim();
    if (!answer) return; // 빈 값 방지

    sendMessage("answer", { message: answer });

    // ✅ 채팅 전송 후 입력 필드 초기화 및 포커스 유지
    answerInput.value = "";
    answerInput.focus();
}

// ✅ 게임 시작 버튼
document.getElementById("start-game-btn")?.addEventListener("click", () => {
    sendMessage("startGame");
});

// ✅ 게임 관련 WebSocket 메시지 처리
addMessageHandler((data) => {
    //console.log("📩 게임에서 받은 데이터:", data);

    switch (data.type) {
        case "quiz":
            displayQuestion(data);
            break;
        case "quizEnd":
            displayMessage(data.message);
            break;
        case "correctAnswer":
            displayMessage(data.message);
            updateScore(data.userId);
            break;
        case "gameEnd":
            displayFinalScores(data);
            break;
        case "updatePlayers":
            displayPlayers(data.players);
            break;
        case "answer":
            displayAnswer(data);
            break;
        case "chat":
            displayChatMessage(data);
            break;
    }
});

// ✅ DOM이 로드된 후 방 정보 불러오기
document.addEventListener("DOMContentLoaded", fetchRoomInfo);

// ✅ UI 업데이트 함수
function displayQuestion(data) {
    document.getElementById("question").textContent = `${data.genre} 문제: ${data.question}`;
}

// ✅ 채팅 메시지를 채팅창에 추가하는 함수
function displayChatMessage(data) {
    const chatBox = document.getElementById("chatBox"); // 채팅 메시지를 표시할 영역
    const messageElement = document.createElement("p");

    // ✅ SYSTEM 메시지일 경우 스타일 변경
    if (data.userId === "SYSTEM") {
        messageElement.innerHTML = `<span class="systemMessage">${data.message}</span>`;
    } else {
        messageElement.innerHTML = `<strong>${data.userId}:</strong> ${data.message}`;
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // 자동 스크롤
}

function displayMessage(message) {
    const chatBox = document.getElementById("chatBox");
    const messageElement = document.createElement("p");
    messageElement.textContent = message;

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function updateScore(userId) {
    const scoreList = document.getElementById("scoreList");
    let userScore = document.getElementById(`score-${userId}`);

    if (!userScore) {
        userScore = document.createElement("li");
        userScore.id = `score-${userId}`;
        userScore.textContent = `${userId}: 1점`;
        scoreList.appendChild(userScore);
    } else {
        let currentScore = parseInt(userScore.textContent.split(": ")[1]);
        userScore.textContent = `${userId}: ${currentScore + 1}점`;
    }
}

function displayFinalScores(data) {
    displayMessage("🎉 게임 종료!");
    displayMessage(`우승자: ${data.winner}`);

    Object.entries(data.scoreboard).forEach(([player, score]) => {
        displayMessage(`${player}: ${score}점`);
    });
}

function displayPlayers(players) {
    const playerList = document.getElementById("playerList");
    playerList.innerHTML = "";

    players.forEach(player => {
        const playerElement = document.createElement("li");
        playerElement.textContent = `${player.userId} - ${player.score}점`;
        playerList.appendChild(playerElement);
    });
}

// ✅ 정답 메시지 출력 함수
function displayAnswer(data) {
    const chatBox = document.getElementById("chatBox");
    const answerElement = document.createElement("p");

    answerElement.innerHTML = `${data.userId} :  ${data.message}`;
    chatBox.appendChild(answerElement);
}

document.addEventListener("DOMContentLoaded", () => {
    const answerInput = document.getElementById("answerInput");

    if (!answerInput) {
        console.warn("⚠️ `answerInput` 요소를 찾을 수 없습니다.");
        return;
    }

    // ✅ 엔터 키 입력 감지 및 채팅 전송
    answerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // 기본 Enter 동작(폼 제출) 방지
            sendAnswer();
        }
    });

    // ✅ 초기 로딩 시 `answerInput`에 포커스
    answerInput.focus();
});

export default { fetchRoomInfo, sendAnswer, displayPlayers };
