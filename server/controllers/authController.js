const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

class AuthController {
  // 회원가입
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // 중복 체크
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "이미 가입된 이메일입니다." });
      }

      // 비밀번호 암호화
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

      // 유저 찾기
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
      }

      // 비밀번호 검증
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
      }

      // JWT 토큰 생성
      const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.json({ message: "로그인 성공!", token, userId: user.id, username: user.username });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "서버 오류 발생" });
    }
  }
}

module.exports = AuthController;
