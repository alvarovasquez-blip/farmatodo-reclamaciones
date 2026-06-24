const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

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

router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

module.exports = router;
