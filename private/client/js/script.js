let socket;
let myId = null;
let hostId = null;
const playerNames = new Map();

function connectAndJoin(type, payload) {
  socket = new WebSocket(`ws://${location.host}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({ type, payload }));
  };

  setupSocketHandlers();
}

// 방 만들기
document.getElementById('createRoomBtn').onclick = () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return alert('닉네임을 입력하세요.');
  connectAndJoin('create_room', { name });
};

// 랜덤 입장
document.getElementById('joinRandomBtn').onclick = () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return alert('닉네임을 입력하세요.');
  connectAndJoin('join_random', { name });
};

// 코드로 입장
document.getElementById('joinBtn').onclick = () => {
  const name = document.getElementById('nameInput').value.trim();
  const roomCode = document.getElementById('roomCodeInput').value.trim();
  if (!name || !roomCode) return alert('닉네임과 방 코드를 입력하세요.');
  connectAndJoin('join_room', { name, roomId: roomCode });
};

function setupSocketHandlers() {
  socket.onmessage = (event) => {
    const { type, payload } = JSON.parse(event.data);

    if (type === 'joined_room') {
      myId = payload.yourId;
      hostId = payload.hostId;
      document.getElementById('game').style.display = 'block';
    }

    if (type === 'player_list') {
      hostId = payload.hostId;
      playerNames.clear();
      payload.players.forEach(p => playerNames.set(p.id, p.name));

      const info = payload.players.map(p => `${p.name}${p.id === hostId ? ' (방장)' : ''}`).join(', ');
      document.getElementById('playerInfo').textContent = `플레이어: ${info}`;
      document.getElementById('hostControls').style.display = (myId === hostId) ? 'block' : 'none';
    }

    if (type === 'host_changed') {
      hostId = payload.hostId;
      if (myId === hostId) {
        document.getElementById('hostControls').style.display = 'block';
        alert('당신이 새로운 방장이 되었습니다.');
      }
    }

    if (type === 'game_started') {
      addChatMessage(`🎮 게임이 시작되었습니다!`);
    }

    if (type === 'question') {
      const q = payload.question;
      const questionBox = document.getElementById('questionBox');
      if (q.type === 'text') {
        questionBox.innerHTML = q.content;
      } else if (q.type === 'image') {
        questionBox.innerHTML = `${q.question_text}<br><img src="${q.content}" width="300">`;
      } else if (q.type === 'audio') {
        questionBox.innerHTML = `${q.question_text}<br><audio src="${q.content}" controls></audio>`;
      }
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
      addChatMessage(`⏱ 시간 초과! 다음 문제로 넘어갑니다.`);
    }

    if (type === 'game_ended') {
      const scoreText = Object.entries(payload.scores)
        .map(([id, score]) => `${getPlayerName(id)}: ${score}점`).join('<br>');
      addChatMessage(`🏁 게임 종료!<br>${scoreText}`);
    }

    if (type === 'timer') {
      document.getElementById('timerDisplay').textContent = `⏱ ${payload.time}초 남음`;
    }
  };
}

// 게임 시작 버튼
document.getElementById('startBtn').onclick = () => {
  socket.send(JSON.stringify({ type: 'start_game' }));
};

// 채팅 전송 버튼
document.getElementById('sendAnswerBtn').onclick = () => {
  const text = document.getElementById('chatInput').value.trim();
  if (text) {
    socket.send(JSON.stringify({ type: 'chat', payload: { text } }));
    document.getElementById('chatInput').value = '';
    document.getElementById('chatInput').focus();
  }
};

// Enter 키 전송
document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('sendAnswerBtn').click();
  }
});

// 자동 스크롤 관리
let autoScrollEnabled = true;
const chatBox = document.getElementById('chatBox');
const chatMessages = document.getElementById('chatMessages');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

chatBox.addEventListener('scroll', () => {
  const threshold = 10;
  const atBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight <= threshold;
  autoScrollEnabled = atBottom;
  scrollToBottomBtn.style.display = atBottom ? 'none' : 'block';
});

scrollToBottomBtn.addEventListener('click', () => {
  chatBox.scrollTop = chatBox.scrollHeight;
  autoScrollEnabled = true;
  scrollToBottomBtn.style.display = 'none';
});

function addChatMessage(html) {
  const msg = document.createElement('div');
  msg.innerHTML = html;
  chatMessages.appendChild(msg);
  if (autoScrollEnabled) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

const playerList = document.getElementById('playerList');
function updateScoreBoard(scoreMap) {
  playerList.innerHTML = '';
  for (const id in scoreMap) {
    const score = scoreMap[id];
    const div = document.createElement('div');
    div.textContent = `${getPlayerName(id)}: ${score}점`;
    playerList.appendChild(div);
  }
}

function getPlayerName(id) {
  return playerNames.get(id) || id;
}