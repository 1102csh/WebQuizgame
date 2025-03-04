const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QuizGame = require("./game"); // 게임 로직

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const game = new QuizGame();

app.use(express.static('public'));

wss.on("connection", (ws) => {
    console.log("새로운 플레이어 접속");

    // 플레이어에게 닉네임 요청 (임시로 "Player" + 숫자로 지정)
    const playerName = "Player" + Math.floor(Math.random() * 1000);
    game.players.set(playerName, ws);

    /*
    // 새로운 문제 출제
    game.startNewQuestion((quizData) => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(quizData));
            }
        });
    });
    */
   
    ws.on("message", (message) => {
        try {
            console.log(`[${playerName}] 입력: ${message}`);
            const data = message.toString(); // 버퍼 -> 문자열로 변환

            const response = {
                type: "message",
                sender: playerName, // 닉네임 추가
                data: data
            };

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(response));
                }
            });

            game.checkAnswer(playerName, data, (response) => {
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(response));
                    }
                });
            });
        }
        catch (error) {
            console.error("메시지 처리 중 오류 발생 : ", error);
        }
    });

    ws.on("close", () => {
        console.log(`${playerName} 퇴장`);
        game.players.delete(playerName);
    });
});

// 서버 실행
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
});
