// gameScript.js
import { socket, myId, hostId, playerNames, setMessageHandler, setMyId, setHostId } from './gameRoomManager.js';
import { addChatMessage, initChat } from './chatManager.js';
import { initScoreBoard, updateScoreBoard, setPlayerNames } from './scoreManager.js';
import { initQuestionBox, renderQuestion } from './questionRenderer.js';
import { initTimerDisplay, updateTimer, clearTimer } from './timerManager.js';
import { initHostControls, showHostControls, hideHostControls } from './hostControl.js';

document.getElementById('sendAnswerBtn').onclick = sendChat;
document.getElementById('startBtn').onclick = () => {
    socket.send(JSON.stringify({ type: 'start_game' }));
};

document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

// 각 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 방장 권한 ( 게임 시작 및 방 설정)
    const hostControlBox = document.getElementById('hostControls');
    initHostControls(hostControlBox);

    // 문제 수신
    const questionBox = document.getElementById('questionBox');
    initQuestionBox(questionBox);

    // 타이머
    const timerDisplay = document.getElementById('timerDisplay');
    initTimerDisplay(timerDisplay);
    
    // 스코어보드
    const playerList = document.getElementById('playerList');
    initScoreBoard(playerList);
    setPlayerNames(playerNames);

    // 채팅
    const chatBox = document.getElementById('chatBox');
    const chatMessages = document.getElementById('chatMessages');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    initChat(chatBox, chatMessages, scrollToBottomBtn);
});

function sendChat() {
    const text = document.getElementById('chatInput').value.trim();
    if (text) {
        socket.send(JSON.stringify({ type: 'chat', payload: { text } }));
        document.getElementById('chatInput').value = '';
        document.getElementById('chatInput').focus();
    }
}

setMessageHandler(({ type, payload }) => {
    if (type === 'joined_room') {
        console.log("?");
        setMyId(payload.yourId);
        setHostId(payload.hostId);
    }

    if (type === 'player_list') {
        setHostId(payload.hostId);
        playerNames.clear();
        payload.players.forEach(p => playerNames.set(p.id, p.name));

        const info = payload.players.map(p => `${p.name}${p.id === hostId ? ' (방장)' : ''}`).join(', ');
        document.getElementById('playerInfo').textContent = `플레이어: ${info}`;
        if (myId === hostId) {
            showHostControls();
        } else {
            hideHostControls();
        }
    }

    if (type === 'host_changed') {
        setHostId(payload.hostId);
        if (myId === hostId) {
            showHostControls();
        } else {
            hideHostControls();
        }
    }

    if (type === 'game_started') {
        addChatMessage(`🎮 게임이 시작되었습니다!`);
    }

    if (type === 'question') {
        renderQuestion(payload.question);
    }

    if (type === 'chat_message') {
        const { sender, message } = payload;
        addChatMessage(`<b>${sender}:</b> ${message}`);
    }

    if (type === 'correct_answer') {
        const { playerId, answer, scores, playerName } = payload;
        addChatMessage(`✅ <b>${playerName}</b>님 정답! (${answer})`);
        updateScoreBoard(scores);
    }

    if (type === 'no_answer') {
        addChatMessage(`⏱ 시간 초과!`);
    }

    if (type === 'game_ended') {
        clearTimer(); // 게임 종료 시 타이머 제거
        const scoreText = Object.entries(payload.scores)
            .map(([id, score]) => `${getPlayerName(id)}: ${score}점`).join('<br>');
        addChatMessage(`🏁 게임 종료!<br>${scoreText}`);
    }

    if (type === 'timer') {
        updateTimer(payload.time); // ⏱ 타이머 표시 갱신
    }
});

function getPlayerName(id) {
    return playerNames.get(id) || id;
}
