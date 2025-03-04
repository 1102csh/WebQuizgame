const { getRandomQuiz } = require("./db");

class QuizGame {    
    constructor() {
        this.currentQuiz = null; // 현재 출제된 문제
        this.players = new Map(); // 플레이어 정보 저장 (닉네임 -> WebSocket)

        this.timer = null; // 타이머 세팅
        this.timeLeft = 30;
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
            callback({
                type: "correctAnswer",
                player: player,
                answer: answer,
                message: `${player}님이 정답 "${answer}"을(를) 맞췄습니다`
            });

            // 다음 문제 출제
            this.startNewQuestion(callback);
        }
    }
}

module.exports = QuizGame;
