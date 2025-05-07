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
  