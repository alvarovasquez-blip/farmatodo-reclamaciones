const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authMiddleware, requireRol } = require('../middleware/auth');

router.get('/', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { rol } = req.query;
    let sql = 'SELECT id,nombre,email,rol,proveedor_nombre,activo,created_at FROM usuarios WHERE activo=1';
    const params = [];
    if (rol) { sql += ' AND rol=?'; params.push(rol); }
    res.json({ usuarios: await db.all(sql, params) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { nombre, email, password, rol, proveedor_nombre } = req.body;
    if (!nombre||!email||!password||!rol) return res.status(400).json({ error: 'Campos requeridos: nombre, email, password, rol' });
    if (!['agente_sac','proveedor'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    const exists = await db.get('SELECT id FROM usuarios WHERE email=?', [email]);
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });
    const id = uuidv4();
    await db.run(`INSERT INTO usuarios (id,nombre,email,password_hash,rol,proveedor_nombre) VALUES (?,?,?,?,?,?)`,
      [id, nombre, email, bcrypt.hashSync(password,10), rol, proveedor_nombre||null]);
    res.status(201).json({ id, nombre, email, rol, proveedor_nombre });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { nombre, activo } = req.body;
    if (nombre !== undefined) await db.run('UPDATE usuarios SET nombre=? WHERE id=?', [nombre, req.params.id]);
    if (activo !== undefined) await db.run('UPDATE usuarios SET activo=? WHERE id=?', [activo?1:0, req.params.id]);
    res.json(await db.get('SELECT id,nombre,email,rol,proveedor_nombre,activo FROM usuarios WHERE id=?', [req.params.id]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
