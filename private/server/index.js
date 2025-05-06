const express = require('express');
const http = require('http');
const { Server } = require('ws');
const path = require('path');
require('dotenv').config();

const socketHandler = require('./socket');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client')));

// WebSocket 연결 시 처리
wss.on('connection', (ws) => {
  socketHandler(ws, wss);
});

// 서버 실행
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
