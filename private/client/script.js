let socket;
let myId = null;
let hostId = null;

document.getElementById('joinBtn').onclick = () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return alert('닉네임을 입력하세요.');

  socket = new WebSocket(`ws://${location.host}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join_room', payload: { name } }));
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
      document.getElementById('chat').innerHTML += `<div>🎮 게임이 시작되었습니다!</div>`;
    }

    if (type === 'question') {
      const q = payload.question;
      document.getElementById('questionBox').textContent = `문제 ${payload.index}/${payload.total}: ${q.text}`;
    }

    if (type === 'correct_answer') {
      const { playerId, answer, scores } = payload;
      document.getElementById('chat').innerHTML += `<div>✅ ${playerId}님 정답! (${answer})</div>`;
    }

    if (type === 'no_answer') {
      document.getElementById('chat').innerHTML += `<div>⏱ 시간 초과! 다음 문제로 넘어갑니다.</div>`;
    }

    if (type === 'game_ended') {
      const scoreText = Object.entries(payload.scores)
        .map(([id, score]) => `${id}: ${score}점`).join('<br>');
      document.getElementById('chat').innerHTML += `<div>🏁 게임 종료!<br>${scoreText}</div>`;
    }
  };
};

document.getElementById('startBtn').onclick = () => {
  socket.send(JSON.stringify({ type: 'start_game' }));
};

document.getElementById('sendAnswerBtn').onclick = () => {
  const answer = document.getElementById('answerInput').value;
  socket.send(JSON.stringify({ type: 'answer', payload: { answer } }));
  document.getElementById('answerInput').value = '';
};
