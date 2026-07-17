import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim().length < 2 || password.length < 4) {
    return res.status(400).json({ error: '用户名至少2个字符，密码至少4个字符' });
  }

  const db = await getDb();
  const existing = db.exec('SELECT id FROM users WHERE username = ?', [username.trim()]);
  if (existing.length && existing[0].values.length) {
    return res.status(409).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username.trim(), hash]);

  const userResult = db.exec('SELECT id, username FROM users WHERE username = ?', [username.trim()]);
  const user = userResult[0].values[0];
  const userId = user[0];

  // Create character for new user
  db.run('INSERT OR IGNORE INTO character (user_id, name, level, total_exp, title) VALUES (?, ?, 1, 0, ?)',
    [userId, username.trim(), '新手冒险者']);
  saveDb();

  const token = generateToken(userId);
  res.status(201).json({ token, user: { id: userId, username: user[1] } });
});

router.post('/reset-password', async (req, res) => {
  const { username, new_password } = req.body;
  if (!username || !new_password || new_password.length < 4) {
    return res.status(400).json({ error: '用户名不能为空，新密码至少4个字符' });
  }

  const db = await getDb();
  const result = db.exec('SELECT id FROM users WHERE username = ?', [username.trim()]);
  if (!result.length || !result[0].values.length) {
    return res.status(404).json({ error: '用户名不存在' });
  }

  const hash = bcrypt.hashSync(new_password, 10);
  db.run('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username.trim()]);
  saveDb();
  res.json({ message: '密码已重置，请使用新密码登录' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const db = await getDb();
  const result = db.exec('SELECT id, username, password_hash FROM users WHERE username = ?', [username.trim()]);
  if (!result.length || !result[0].values.length) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const [userId, dbUsername, passwordHash] = result[0].values[0];
  const valid = bcrypt.compareSync(password, passwordHash);
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(userId);
  res.json({ token, user: { id: userId, username: dbUsername } });
});

export default router;
