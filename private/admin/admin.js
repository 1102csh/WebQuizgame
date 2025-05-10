document.getElementById('quizForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    type: document.getElementById('type').value,
    question_text: document.getElementById('questionText').value.trim(),
    content: document.getElementById('content').value.trim(),
    genre: document.getElementById('genre').value.trim(),
    answers: document.getElementById('answers').value
      .split(',').map(a => a.trim()).filter(a => a !== '')
  };

  const res = await fetch('/admin/insert-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  alert(result.message);

  document.getElementById('questionText').value = "";
  document.getElementById('content').value = "";
  document.getElementById('genre').value = "";
  document.getElementById('answers').value = "";
});

document.getElementById('loadQuizzesBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/admin/quizzes');
    const quizzes = await res.json();

    const listDiv = document.getElementById('quizList');
    listDiv.innerHTML = ''; // 기존 내용 초기화

    quizzes.forEach(q => {
      const div = document.createElement('div');
      div.className = 'quiz-item';
      div.innerHTML = `
          <b>ID:</b> ${q.id}<br>
          <b>유형:</b> ${q.type}<br>
          <b>장르:</b> ${q.genre}<br>
          <b>질문:</b> ${q.question_text}<br>
          <b>내용:</b> ${q.content}<br>
          <hr>
        `;
      listDiv.appendChild(div);
    });
  } catch (err) {
    alert('문제 목록을 불러오는 데 실패했습니다.');
    console.error(err);
  }
});
