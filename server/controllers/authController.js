const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret";

exports.register = async (req, res) => {
  const { email, password, username } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  await db.query("INSERT INTO users (email, username, password) VALUES (?, ?, ?)", [email, username, hashed]);

  const token = jwt.sign({ email, username }, JWT_SECRET, { expiresIn: "2h" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // HTTPS에서만 true
    sameSite: "strict",
  });

  res.json({ success: true });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (rows.length === 0) return res.status(401).json({ message: "이메일 없음" });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "비밀번호 틀림" });

  const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "2h" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });

  res.json({ success: true });
};
