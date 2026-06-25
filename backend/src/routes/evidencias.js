const router = require('express').Router({ mergeParams: true });
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function uploadToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'farmatodo-reclamaciones', public_id: uuidv4(), resource_type: resourceType },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });
}

router.post('/', authMiddleware, upload.array('archivos', 10), async (req, res) => {
  try {
    const r = await db.get('SELECT * FROM reclamaciones WHERE id=?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Reclamación no encontrada' });
    if (req.user.rol === 'proveedor' && r.proveedor_id !== req.user.id)
      return res.status(403).json({ error: 'Sin acceso' });
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No se enviaron archivos' });

    const insertados = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, file.mimetype);
      const id = uuidv4();
      await db.run(
        `INSERT INTO evidencias (id,reclamacion_id,usuario_id,nombre_original,nombre_archivo,tipo_mime,tamano) VALUES (?,?,?,?,?,?,?)`,
        [id, req.params.id, req.user.id, file.originalname, result.secure_url, file.mimetype, file.size]
      );
      insertados.push({ id, nombre_original: file.originalname, nombre_archivo: result.secure_url, tipo_mime: file.mimetype, tamano: file.size, usuario_nombre: req.user.nombre, usuario_rol: req.user.rol });
    }
    await db.run(`INSERT INTO historial (id,reclamacion_id,usuario_id,tipo,descripcion) VALUES (?,?,?,?,?)`,
      [uuidv4(), req.params.id, req.user.id, 'evidencia', `${req.files.length} archivo(s) cargado(s) por ${req.user.nombre}`]);
    res.status(201).json({ evidencias: insertados });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
