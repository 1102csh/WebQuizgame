const pool = require("../config/db");

class User {
  static async createUser(username, email, hashedPassword) {
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    const [result] = await pool.query(sql, [username, email, hashedPassword]);
    return result.insertId;
  }

  static async findByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);
    return rows[0]; // 첫 번째 결과 반환
  }

  static async findByUsername(username) {
    const sql = "SELECT * FROM users WHERE username = ?";
    const [rows] = await pool.query(sql, [username]);
    return rows[0];
  }
}

module.exports = User;