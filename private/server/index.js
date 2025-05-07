const express = require('express');
const http = require('http');
const { Server } = require('ws');
const path = require('path');
require('dotenv').config();

const socketHandler = require('./socket');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client')));

app.use(express.json())
app.use('/admin', express.static('../admin')); // 관리자 정적 파일

app.post('/admin/insert-quiz', async (req, res) => {
  try {
    const { type, content, genre, question_text, answers } = req.body;

    const [quizResult] = await db.query(
      'INSERT INTO quizzes (type, question_text, content, genre) VALUES (?, ?, ?, ?)',
      [type, question_text, content, genre]
    );
    const quizId = quizResult.insertId;

    for (const answer of answers) {
      await db.query(
        'INSERT INTO quiz_answers (quiz_id, answer_text) VALUES (?, ?)',
        [quizId, answer]
      );
    }

    res.json({ success: true, message: '문제가 성공적으로 등록되었습니다!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// WebSocket 연결 시 처리
wss.on('connection', (ws) => {
  socketHandler(ws, wss);
});

// 서버 실행
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
