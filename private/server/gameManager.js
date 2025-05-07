const db = require('./db');

class GameManager {
  constructor(room) {
    this.room = room;
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.timer = null;
    this.countdown = null;
    this.timeLeft = 0; // 문제당 제한시간 (초)
    this.timeLIMIT = 10;
    this.answered = false;
    this.scores = {}; // 플레이어 ID -> 점수
  }

  async start() {
    this.questions = await this.loadQuestions();
    this.broadcast('game_started', {});
    this.nextQuestion();
  }

  async loadQuestions() {
    const [rows] = await db.query('SELECT * FROM quizzes ORDER BY RAND() LIMIT 10');
    console.log("로드된 문제 수:", rows.length);
    return rows;
  }

  nextQuestion() {
    // ✅ 먼저 이전 타이머가 남아 있다면 정리
    if (this.timer) clearTimeout(this.timer);
    if (this.countdown) clearInterval(this.countdown);
    
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    this.answered = false;
    const question = this.questions[this.currentQuestionIndex];

    console.log("출력할 문제:", question);
    this.broadcast('question', {
      index: this.currentQuestionIndex + 1,
      total: this.questions.length,
      question: {
        id: question.id,
        type: question.type, // 객관식/주관식 등
        question_text: question.question_text, // ✅ 꼭 있어야 함!
        content: question.content, // ✅ 이미지 or 오디오용
        options: question.options ? JSON.parse(question.options) : null,
      },
    });

    // ⏱️ 타이머 시작
    this.timeLeft = this.timeLIMIT;
    this.broadcast('timer', { time: this.timeLeft });

    this.countdown = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast('timer', { time: this.timeLeft });

      if (this.timeLeft <= 0) {
        clearInterval(this.countdown);
      }
    }, 1000);

    this.timer = setTimeout(() => {
      if (!this.answered) {
        this.broadcast('no_answer', {});
        this.currentQuestionIndex++;
        setTimeout(() => {
          this.nextQuestion();
        }, 3000);
      }
    }, this.timeLeft * 1000);
  }

  async checkAnswer(ws, userAnswer) {
    if (this.answered) return false;
    if (!userAnswer || typeof userAnswer !== 'string') return false;

    const current = this.questions[this.currentQuestionIndex];
    const quizId = current.id;

    const [answers] = await db.query(
      'SELECT answer_text FROM quiz_answers WHERE quiz_id = ?',
      [quizId]
    );

    const normalized = userAnswer.trim().toLowerCase();
    const isCorrect = answers.some(row => row.answer_text.trim().toLowerCase() === normalized);

    if (isCorrect) {
      this.answered = true;
      clearTimeout(this.timer);
      clearInterval(this.countdown);
      if (!this.scores[ws.id]) this.scores[ws.id] = 0;
      this.scores[ws.id] += 10;

      const player = this.room.playersById.get(ws.id);
      this.broadcast('correct_answer', {
        playerId: ws.id,
        playerName: player?.name || ws.id,
        answer: userAnswer,
        scores: this.scores
      });

      this.currentQuestionIndex++;
      setTimeout(() => this.nextQuestion(), 3000);

      return true; // ✅ 정답 처리 완료
    }

    return false; // ❌ 정답 아님
  }

  endGame() {
    this.broadcast('game_ended', {
      scores: this.scores,
    });

    this.room.game = null; // 게임 종료 시 참조 제거
  }

  broadcast(type, payload) {
    this.room.broadcast(type, payload);
  }
}

module.exports = GameManager;
