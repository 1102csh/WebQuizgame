import { addMessageHandler, sendMessage } from "./socket.js";
window.sendAnswer = sendAnswer; // 전역등록

// ✅ 쿠키에서 값 추출
function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
}

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const isHost = urlParams.get("host") === "true";
console.log("🎯 현재 URL의 roomId:", roomId); // 추가

let currentUserId = null; // 서버에서 받은 userId
let currentHostId = null; // 서버에서 받은 hostId

// ✅ 방 정보 불러오기
async function fetchRoomInfo() {

    try {
        const response = await fetch(`/api/game/room/${roomId}`, {
            method: "GET",
            credentials: "include" // ✅ 추가!
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            window.location.href = "/index.html";
            return;
        }

        currentHostId = data.hostId;
        document.getElementById("roomNumber").textContent = `[ ${data.roomNumber} ]`;
        document.getElementById("roomTitle").textContent = data.title;

        displayPlayers(data.players, currentHostId);
    } catch (err) {
        console.error("방 정보 불러오기 오류:", err);
    }
}

// ✅ 유저 인증된 토큰에서 userId 파싱
(function identifyUser() {
    const token = getCookie("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            currentUserId = payload.userId;
        } catch (err) {
            console.error("❌ 유저 파싱 실패", err);
        }
    }
})();

// ✅ 게임 관련 WebSocket 메시지 처리
addMessageHandler((data) => {
    switch (data.type) {
        case "updatePlayers":
            displayPlayers(data.players, data.hostId);
            break;
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
        case "answer":
            displayAnswer(data);
            break;
        case "gameEnd":
            displayFinalScores(data);
            break;
    }
});

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

// ✅ 플레이어 출력
function displayPlayers(players, hostId) {
    const playerList = document.getElementById("playerList");
    playerList.innerHTML = "";

    players.forEach((player) => {
        const playerCard = document.createElement("div");
        playerCard.className = "player-card";
    
        const isHost = player.userId === hostId;
        const displayName = player.username || player.userId;
    
        console.log("✅ 렌더링 player 정보:", {
            userId: player.userId,
            username: player.username,
            displayName
          });
          
        // 👑 호스트 표시
        const iconDiv = document.createElement("div");
        iconDiv.className = "playerIcon";
        if (isHost) {
            const crown = document.createElement("span");
            crown.className = "host";
            iconDiv.appendChild(crown);
        }
    
        // 이름
        const nameDiv = document.createElement("div");
        nameDiv.className = "player-name";
        nameDiv.textContent = displayName;
    
        // 점수
        const scoreDiv = document.createElement("div");
        scoreDiv.className = "player-score";
        scoreDiv.textContent = `${player.score}점`;
    
        playerCard.appendChild(iconDiv);
        playerCard.appendChild(nameDiv);
        playerCard.appendChild(scoreDiv);
        playerList.appendChild(playerCard);
    });

    // ✅ 내가 호스트인 경우 게임 시작 버튼 표시
    if (currentUserId === hostId && !document.querySelector(".start-btn")) {
        const startBtn = document.createElement("button");
        startBtn.textContent = "게임 시작";
        startBtn.classList.add("start-btn");
        startBtn.id = "start-game-btn";
        startBtn.addEventListener("click", () => {
            sendMessage("startGame");
        });
        document.querySelector(".roomInfoWrap").appendChild(startBtn);
    } else if (currentUserId !== hostId) {
        const btn = document.querySelector(".start-btn");
        if (btn) btn.remove();
    }
}

// ✅ 정답 메시지 출력 함수
function displayAnswer(data) {
    const chatBox = document.getElementById("chatBox");
    const answerElement = document.createElement("p");

    answerElement.innerHTML = `${data.userId} :  ${data.message}`;
    chatBox.appendChild(answerElement);
}

document.addEventListener("DOMContentLoaded", () => {
    const leftRoom = sessionStorage.getItem("leftRoom");
    if (leftRoom === "true") {
        sessionStorage.removeItem("leftRoom"); // ✅ 남아있는 플래그 제거
        window.location.href = "/index.html";
        return;
    }

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
