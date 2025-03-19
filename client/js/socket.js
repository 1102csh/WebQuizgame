// WebSocket 전역 객체 생성
const socket = new WebSocket(`wss://${window.location.host}`);

socket.onopen = () => {
    console.log("WebSocket 연결 성공!");
};

window.addEventListener("beforeunload", () => {
    socket.close();
});

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("서버 메시지:", data);

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
            displayPlayers(data.players); // 게임 화면에서 플레이어 목록 업데이트
            break;
    }
};

function startGame() {
    socket.send(JSON.stringify({ type: "startGame", roomId: "1234" }));
}

export function sendAnswer() {
    const answer = document.getElementById("answer-input").value;

    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = `player_${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem("userId", userId);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    const messageData = JSON.stringify({ 
        type: "answer", 
        roomId: roomId,
        userId: userId,
        message: answer 
    });

    console.log("전송된 메시지:", messageData); // ✅ 메시지가 정상적으로 생성되었는지 확인

    socket.send(messageData); // 메시지 전송

    document.getElementById("answer-input").value = "";
}

function displayQuestion(data) {
    document.getElementById("question-box").textContent = `${data.genre} 문제: ${data.question}`;
}

function displayMessage(message) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function updateScore(userId) {
    const scoreList = document.getElementById("score-list");
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
    const playerList = document.getElementById("player-list");
    playerList.innerHTML = "";

    players.forEach(player => {
        const playerElement = document.createElement("li");
        playerElement.textContent = `${player.userId} - ${player.score}점`;
        playerList.appendChild(playerElement);
    });
}

async function showRankings() {
    const response = await fetch("http://localhost:8080/api/rankings");
    const rankings = await response.json();

    const rankingBox = document.getElementById("ranking-box");
    rankingBox.innerHTML = "<h3>🏆 랭킹</h3>";
    
    rankings.forEach((rank, index) => {
        const rankElement = document.createElement("p");
        rankElement.textContent = `${index + 1}. ${rank.username} - ${rank.score}점`;
        rankingBox.appendChild(rankElement);
    });
}

export default socket;