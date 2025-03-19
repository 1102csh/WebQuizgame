const pool = require("../config/db");

async function saveRanking(username, score) {
    const sql = "INSERT INTO rankings (username, score) VALUES (?, ?)";
    await pool.query(sql, [username, score]);
}

async function getTopRankings() {
    const sql = "SELECT username, score FROM rankings ORDER BY score DESC LIMIT 10";
    const [rows] = await pool.query(sql);
    return rows;
}

module.exports = { saveRanking, getTopRankings };
