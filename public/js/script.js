const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
    //document.getElementById("status").innerText = "서버에 연결됨";
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("수신 데이터:", data);

    const TIME_LIMIT = 30;
    if (data.type === "message") {
        addMessageToChat(`${data.sender}: ${data.data}`,"guest");
    } 
    else if (data.type === "playerList") {
        updatePlayerList(data.players);
    } 
    else if (data.type === "newQuestion") {
        document.getElementById("genre").innerText = "주제 : " + data.genre;
        document.getElementById("question").innerText = data.question;
        
        // 전체 시간(TIME_LIMIT)에 맞춰 진행바 초기화
        document.getElementById("timer").style.width = "100%";
        document.getElementById("timer").style.backgroundColor = "skyblue";
    }
    else if (data.type === "timeUpdate") {
        let percentage = (data.timeLeft / TIME_LIMIT) * 100;
        
        // 남은 시간에 따라 너비 변경
        document.getElementById("timer").style.width = percentage + "%";

        if(data.timeLeft<=10) document.getElementById("timer").style.backgroundColor = "red";
    }
    else if (data.type === "timeUp") {
        document.getElementById("timer").style.width = "0%";
    }
    else if (data.type === "correctAnswer") {
        addMessageToChat(`${data.message}`, "system");
    } 
};

// 메시지를 채팅 로그에 추가하는 함수
function addMessageToChat(message,type) {
    const messages = document.getElementById("messages");
    const li = document.createElement("li");

    if(type === "system"){
        li.style.color = "skyblue";
        li.style.fontWeight = 'bold';
    }
    li.textContent = message;
    messages.appendChild(li);

    // 스크롤을 아래로 자동 이동
    const chatBox = document.getElementById("chatBox");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById("messageInput");
    if (input.value.trim() === "") return; // 빈 메시지는 전송하지 않음

    ws.send(input.value);
    input.value = "";
}

// 엔터 키가 눌렸을 때 메시지를 전송하고 입력창을 focus하도록 설정
document.getElementById("messageInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
        // 메시지를 전송한 후 입력창에 다시 focus
        document.getElementById("messageInput").focus();
    }
});

// 플레이어 목록 업데이트
function updatePlayerList(players) {
    const playerListElement = document.getElementById("playerList");
    playerListElement.innerHTML = ""; // 기존 목록 초기화

    players.forEach(player => {
        const li = document.createElement("li");
        li.textContent = player;
        playerListElement.appendChild(li);
    });
}