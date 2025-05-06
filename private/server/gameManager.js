const db = require('./db');

class GameManager {
  constructor(room) {
    this.room = room;
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.timer = null;
    this.timeLimit = 15; // 초 단위 (문제당 제한 시간)
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
    return rows;
  }

  nextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    this.answered = false;
    const question = this.questions[this.currentQuestionIndex];

    this.broadcast('question', {
      index: this.currentQuestionIndex + 1,
      total: this.questions.length,
      question: {
        id: question.id,
        text: question.question_text,
        type: question.type, // 객관식/주관식 등
        options: question.options ? JSON.parse(question.options) : null,
      },
      timeLimit: this.timeLimit
    });

    this.timer = setTimeout(() => {
      if (!this.answered) {
        this.broadcast('no_answer', {});
        this.currentQuestionIndex++;
        this.nextQuestion();
      }
    }, this.timeLimit * 1000);
  }

  checkAnswer(ws, answer) {
    if (this.answered) return;

    const current = this.questions[this.currentQuestionIndex];
    const correct = current.answer.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    if (userAnswer === correct) {
      this.answered = true;
      clearTimeout(this.timer);

      if (!this.scores[ws.id]) this.scores[ws.id] = 0;
      this.scores[ws.id] += 10;

      this.broadcast('correct_answer', {
        playerId: ws.id,
        answer: current.answer,
        scores: this.scores,
      });

      this.currentQuestionIndex++;
      setTimeout(() => this.nextQuestion(), 2000); // 2초 후 다음 문제
    }
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
