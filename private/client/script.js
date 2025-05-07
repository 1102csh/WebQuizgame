let socket;
let myId = null;
let hostId = null;
const playerNames = new Map();

document.getElementById('joinBtn').onclick = () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return alert('닉네임을 입력하세요.');

  const roomCode = document.getElementById('roomCodeInput').value.trim();
  socket = new WebSocket(`ws://${location.host}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join_room', payload: { name: name, roomId: roomCode } }));
  };

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

      document.getElementById('playerInfo').innerText = "";
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
      document.getElementById('chatMessages').innerHTML += `<div>🎮 게임이 시작되었습니다!</div>`;
    }

    if (type === 'question') {
      const q = payload.question;
      console.log('수신된 문제:', q); // ✅ 디버깅용 추가

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
      updateScoreBoard(scores); // ⬅ 점수판 업데이트
    }

    if (type === 'no_answer') {
      document.getElementById('chatMessages').innerHTML += `<div>⏱ 시간 초과! 다음 문제로 넘어갑니다.</div>`;
    }

    if (type === 'game_ended') {
      const scoreText = Object.entries(payload.scores)
        .map(([id, score]) => `${id}: ${score}점`).join('<br>');
      document.getElementById('chatMessages').innerHTML += `<div>🏁 게임 종료!<br>${scoreText}</div>`;
    }

    if (type === 'timer') {
      document.getElementById('timerDisplay').textContent = `⏱ ${payload.time}초 남음`;
    }
  };
};

document.getElementById('startBtn').onclick = () => {
  socket.send(JSON.stringify({ type: 'start_game' }));
};

document.getElementById('sendAnswerBtn').onclick = () => {
  const text = document.getElementById('chatInput').value.trim();
  socket.send(JSON.stringify({ type: 'chat', payload: { text } }));
  document.getElementById('chatInput').value = '';
};

let autoScrollEnabled = true;

const chatBox = document.getElementById('chatBox');
const chatMessages = document.getElementById('chatMessages');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

chatBox.addEventListener('scroll', () => {
  const threshold = 10;
  const atBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight <= threshold;
  autoScrollEnabled = atBottom;

  // 버튼 표시 여부 결정
  scrollToBottomBtn.style.display = atBottom ? 'none' : 'block';
});

function addChatMessage(messageHtml) {
  const msgElem = document.createElement('div');
  msgElem.innerHTML = messageHtml;
  chatMessages.appendChild(msgElem);

  if (autoScrollEnabled) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// 버튼 클릭 시 맨 아래로 스크롤
scrollToBottomBtn.addEventListener('click', () => {
  chatBox.scrollTop = chatBox.scrollHeight;
  autoScrollEnabled = true;
  scrollToBottomBtn.style.display = 'none';
});

const playerList = document.getElementById('playerList');

function updateScoreBoard(scoreMap) {
  // 모든 기존 목록 제거
  playerList.innerHTML = '';

  // 각 플레이어 정보를 출력
  for (const playerId in scoreMap) {
    const score = scoreMap[playerId];
    const div = document.createElement('div');
    div.textContent = `${getPlayerName(playerId)}: ${score}점`;
    playerList.appendChild(div);
  }
}

function getPlayerName(id) {
  return playerNames.get(id) || id;
}
