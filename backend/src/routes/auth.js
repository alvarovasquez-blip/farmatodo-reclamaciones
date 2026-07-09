const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');
const crypto = require('crypto');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://farmatodo-frontend.onrender.com';

async function enviarEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Farmatodo Reclamaciones <onboarding@resend.dev>', to, subject, html })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error enviando email');
  return data;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const user = await db.get('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, proveedor_nombre: user.proveedor_nombre },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, proveedor_nombre: user.proveedor_nombre } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try {
    const user = await db.get('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    // Siempre respondemos ok para no revelar si el email existe
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 3600000).toISOString(); // 1 hora

    await db.run(`UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE id = ?`,
      [token, expira, user.id]);

    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    await enviarEmail(
      email,
      'Recuperación de contraseña — Farmatodo Reclamaciones',
      `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <div style="background:#0C3D74;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h2 style="color:white;margin:0;font-size:18px">Farmatodo · Reclamaciones</h2>
        </div>
        <div style="background:#f9f9f9;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5">
          <p style="color:#333;font-size:15px">Hola <strong>${user.nombre}</strong>,</p>
          <p style="color:#555;font-size:14px">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${link}" style="background:#0C3D74;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#999;font-size:12px">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
        </div>
      </div>
      `
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  try {
    const user = await db.get(
      `SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expira > ? AND activo = 1`,
      [token, new Date().toISOString()]
    );
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });

    await db.run(
      `UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?`,
      [bcrypt.hashSync(password, 10), user.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
