const router = require('express').Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => { const ext = path.extname(file.originalname); cb(null, `${uuidv4()}${ext}`); }
});
const upload = multer({ storage, limits: { fileSize: 50*1024*1024 } });

router.post('/', authMiddleware, upload.array('archivos', 10), async (req, res) => {
  try {
    const r = await db.get('SELECT * FROM reclamaciones WHERE id=?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reclamación no encontrada' });
    if (req.user.rol === 'proveedor' && r.proveedor_id !== req.user.id) return res.status(403).json({ error: 'Sin acceso' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No se enviaron archivos' });
    const insertados = [];
    for (const file of req.files) {
      const id = uuidv4();
      await db.run(`INSERT INTO evidencias (id,reclamacion_id,usuario_id,nombre_original,nombre_archivo,tipo_mime,tamano) VALUES (?,?,?,?,?,?,?)`,
        [id, req.params.id, req.user.id, file.originalname, file.filename, file.mimetype, file.size]);
      insertados.push({ id, nombre_original: file.originalname, nombre_archivo: file.filename, tipo_mime: file.mimetype, tamano: file.size, usuario_nombre: req.user.nombre, usuario_rol: req.user.rol });
    }
    await db.run(`INSERT INTO historial (id,reclamacion_id,usuario_id,tipo,descripcion) VALUES (?,?,?,?,?)`,
      [uuidv4(), req.params.id, req.user.id, 'evidencia', `${req.files.length} archivo(s) cargado(s) por ${req.user.nombre}`]);
    res.status(201).json({ evidencias: insertados });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
