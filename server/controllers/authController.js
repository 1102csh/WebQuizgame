const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;

class AuthController {
  // 회원가입
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "이미 가입된 이메일입니다." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await User.createUser(username, email, hashedPassword);
      res.status(201).json({ message: "회원가입 성공!", userId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "서버 오류 발생" });
    }
  }

  // 로그인
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
      }
      const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: "1h" });
      res.cookie("token", token, { httpOnly: true, secure: false });
      res.json({ message: "로그인 성공!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "서버 오류 발생" });
    }
  }

  // 로그아웃
  static logout(req, res) {
    res.clearCookie("token");
    res.json({ message: "로그아웃 되었습니다." });
  }

  // 로그인 상태 확인
  static getMe(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "토큰이 없습니다." });
    try {
      const decoded = jwt.verify(token, jwtSecret);
      res.json({ userId: decoded.userId, username: decoded.username });
    } catch {
      res.status(401).json({ message: "토큰 인증 실패" });
    }
  }
}

module.exports = AuthController;
