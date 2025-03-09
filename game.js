const { getRandomQuiz } = require("./db");

class QuizGame {    
    constructor() {
        this.currentQuiz = null; // 현재 출제된 문제
        this.players = new Map(); // 플레이어 정보 저장 (닉네임 -> WebSocket)
        this.scores = {}; // 플레이어 점수 저장 (닉네임 -> 점수)

        this.timer = null; // 타이머 세팅
        this.timeLeft = 30;
    }

    // 플레이어 추가 및 브로드캐스팅
    addPlayer(nickname, ws) {
        this.players.set(nickname, ws);
        
        // 신규 플레이어 점수 초기화
        if (!this.scores[nickname]) {
            this.scores[nickname] = 0;
        }

        console.log(`${nickname} 님이 접속했습니다.`);

        this.broadcastPlayerList(); // 업데이트된 플레이어 목록 전송
    }

    // 플레이어 제거 및 브로드캐스팅
    removePlayer(nickname) {
        if (this.players.has(nickname)) {
            this.players.delete(nickname);
            delete this.scores[nickname]; // 플레이어 퇴장 시 점수 제거

            console.log(`${nickname} 님이 퇴장했습니다.`);
            this.broadcastPlayerList(); // 업데이트된 플레이어 목록 전송
        }
    }

    // 현재 접속 중인 플레이어 목록 및 점수를 브로드캐스팅
    broadcastPlayerList() {
        const playerList = Array.from(this.players.keys()); // 현재 접속 중인 닉네임 목록
        const playerScores = this.scores; // 현재 점수 목록

        const message = JSON.stringify({ 
            type: "playerList", 
            players: playerList,
            scores: playerScores
        });

        this.players.forEach((ws) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(message);
            }
        });

        console.log("현재 접속 플레이어 목록:", playerList);
        console.log("현재 점수:", playerScores);
    }

    // 새 문제 출제
    startNewQuestion(callback) {
        getRandomQuiz((quiz) => {
            if (quiz) {
                this.currentQuiz = quiz;
                callback({
                    type: "newQuestion",
                    genre: quiz.genre,
                    question: quiz.question,
                    hint: quiz.hint,
                    hint2: quiz.hint2,
                    timeLeft: 30 // 제한 시간 (초)
                });
            }
        });
        
        this.timeLeft = 30;
        this.timer = setInterval(() => {
            console.log(this.timeLeft);
            this.timeLeft--;

            if(this.timeLeft <= 0){
                clearInterval(this.timer);
                console.log("시간 종료");

                callback({ type:"timeUp" });

                setTimeout(() => {
                    this.startNewQuestion(callback);
                }, 3000);
            }
            else{
                callback({ type:"timeUpdate", timeLeft:this.timeLeft });
            }
        }, 1000);
    }

    // 플레이어 정답 체크
    checkAnswer(player, message, callback) {
        if (!this.currentQuiz) return;

        const answer = this.currentQuiz.answer.trim().toLowerCase();
        const playerAnswer = message.trim().toLowerCase();

        if (playerAnswer === answer) {
            // 정답 맞춘 플레이어 점수 추가
            if (this.scores[player] !== undefined) {
                this.scores[player] += 1;
            }

            callback({
                type: "correctAnswer",
                player: player,
                answer: answer,
                score: this.scores[player], // 추가된 점수 정보
                message: `${player}님이 정답 "${answer}"을(를) 맞추고 ${this.scores[player]}점이 되었습니다!`
            });

            clearInterval(this.timer);
            this.broadcastPlayerList();
            
            // 다음 문제 출제
            this.startNewQuestion(callback);
        }
    }
}

module.exports = QuizGame;
