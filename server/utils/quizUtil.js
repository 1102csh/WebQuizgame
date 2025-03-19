const pool = require("../config/db");

async function getRandomQuiz() {
  const sql = `
    SELECT q.id, q.question, q.genre, 
           (SELECT GROUP_CONCAT(answer) FROM quiz_answers WHERE quiz_id = q.id) AS answers
    FROM quizzes q
    ORDER BY RAND()
    LIMIT 1;
  `;
  const [rows] = await pool.query(sql);
  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    question: rows[0].question,
    genre: rows[0].genre,
    answers: rows[0].answers.split(","), // 여러 정답을 배열로 변환
  };
}

module.exports = { getRandomQuiz };
