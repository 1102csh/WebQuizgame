const mysql = require("mysql2");

// 데이터베이스 연결 설정
const db = mysql.createPool({
    host: "localhost",
    user: "",
    password: "",
    database: "",
    waitForConnections: true,
    connectionLimit: 10, // 동시에 연결 가능한 최대 수
    queueLimit: 0,
});

// 랜덤 퀴즈 문제 가져오는 함수
function getRandomQuiz(callback) {
    const query = `
        SELECT q.id, q.question, q.genre, q.hint, a.answer 
        FROM quizzes q 
        JOIN quiz_answers a ON q.id = a.quiz_id 
        ORDER BY RAND() 
        LIMIT 1;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("퀴즈 문제를 가져오는 중 오류 발생:", err);
            callback(null);
            return;
        }

        if (results.length > 0) {
            callback(results[0]); // 첫 번째 결과 반환
        } else {
            callback(null);
        }
    });
}

// 모듈 내보내기
module.exports = { db, getRandomQuiz };
