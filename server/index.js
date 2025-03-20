const express = require("express");
const http = require("http");
const path = require("path");  // 🔹 경로 설정을 위한 `path` 모듈 추가
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const setupWebSocket = require("./server");

const app = express();
const server = http.createServer(app); // HTTP 서버 생성
setupWebSocket(server); // WebSocket 서버 실행

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 🔹 `client` 폴더의 정적 파일 제공
app.use(express.static(path.join(__dirname, "..", "client")));

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

app.get("/", (req, res) => {
    res.send("퀴즈 게임 서버가 실행 중입니다!");
});

// 서버 실행
server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중`);
});
