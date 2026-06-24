const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware, requireRol } = require('../middleware/auth');
const path = require('path');

const MOTIVOS_REEMBOLSO = ['Pedido incompleto','Retracto de compra','Pedido no llega','Calidad de producto'];
const ESTADOS = ['abierto','revision','proveedor','resuelto','cerrado'];
const ESTADO_LABELS = {abierto:'Abierto',revision:'En revisión',proveedor:'Pendiente proveedor',resuelto:'Resuelto',cerrado:'Cerrado'};

function generarNumero() {
  return `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;
}

async function registrarHistorial(reclamacion_id, usuario_id, tipo, descripcion) {
  await db.run(`INSERT INTO historial (id,reclamacion_id,usuario_id,tipo,descripcion) VALUES (?,?,?,?,?)`,
    [uuidv4(), reclamacion_id, usuario_id, tipo, descripcion]);
}

async function registrarNotificacion(reclamacion_id, destinatario, tipo, mensaje) {
  await db.run(`INSERT INTO notificaciones (id,reclamacion_id,destinatario,tipo,mensaje) VALUES (?,?,?,?,?)`,
    [uuidv4(), reclamacion_id, destinatario, tipo, mensaje]);
  console.log(`📬 Notificación [${tipo}] → ${destinatario}: ${mensaje}`);
}

async function enriquecer(r) {
  if (!r) return null;
  r.historial = await db.all(`SELECT h.*,u.nombre as usuario_nombre,u.rol as usuario_rol FROM historial h LEFT JOIN usuarios u ON h.usuario_id=u.id WHERE h.reclamacion_id=? ORDER BY h.created_at ASC`, [r.id]);
  r.comentarios = await db.all(`SELECT c.*,u.nombre as usuario_nombre,u.rol as usuario_rol FROM comentarios c JOIN usuarios u ON c.usuario_id=u.id WHERE c.reclamacion_id=? ORDER BY c.created_at ASC`, [r.id]);
  r.evidencias = await db.all(`SELECT e.*,u.nombre as usuario_nombre,u.rol as usuario_rol FROM evidencias e JOIN usuarios u ON e.usuario_id=u.id WHERE e.reclamacion_id=? ORDER BY e.created_at ASC`, [r.id]);
  return r;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { estado, q, motivo } = req.query;
    let sql = `SELECT r.*,u.nombre as agente_nombre FROM reclamaciones r JOIN usuarios u ON r.agente_id=u.id WHERE 1=1`;
    const params = [];
    if (req.user.rol === 'proveedor') { sql += ' AND r.proveedor_id=?'; params.push(req.user.id); }
    if (estado) { sql += ' AND r.estado=?'; params.push(estado); }
    if (motivo) { sql += ' AND r.motivo=?'; params.push(motivo); }
    if (q) { sql += ' AND (r.orden LIKE ? OR r.titular LIKE ? OR r.numero LIKE ?)'; const l=`%${q}%`; params.push(l,l,l); }
    sql += ' ORDER BY r.created_at DESC';
    const rows = await db.all(sql, params);
    res.json({ reclamaciones: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const stats = {};
    for (const e of ESTADOS) {
      const r = await db.get('SELECT COUNT(*) as c FROM reclamaciones WHERE estado=?', [e]);
      stats[e] = r.c;
    }
    const tot = await db.get('SELECT COUNT(*) as c FROM reclamaciones');
    stats.total = tot.c;
    const avg = await db.get(`SELECT AVG(CAST((julianday(updated_at)-julianday(created_at))*24 AS REAL)) as avg_horas FROM reclamaciones WHERE estado IN ('resuelto','cerrado')`);
    stats.tiempo_promedio_horas = avg.avg_horas ? Math.round(avg.avg_horas*10)/10 : null;
    res.json(stats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await db.get(`SELECT r.*,u.nombre as agente_nombre FROM reclamaciones r JOIN usuarios u ON r.agente_id=u.id WHERE r.id=?`, [req.params.id]);
    if (!r) return res.status(404).json({ error: 'No encontrada' });
    if (req.user.rol === 'proveedor' && r.proveedor_id !== req.user.id) return res.status(403).json({ error: 'Sin acceso' });
    res.json(await enriquecer(r));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { orden, guia, titular, fecha_solicitud, motivo, descripcion, medio_reembolso } = req.body;
    if (!orden||!titular||!fecha_solicitud||!motivo||!descripcion) return res.status(400).json({ error: 'Faltan campos obligatorios' });
    const id = uuidv4(); const numero = generarNumero();
    await db.run(`INSERT INTO reclamaciones (id,numero,orden,guia,titular,fecha_solicitud,motivo,descripcion,medio_reembolso,agente_id) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id,numero,orden,guia||null,titular,fecha_solicitud,motivo,descripcion,medio_reembolso||null,req.user.id]);
    await registrarHistorial(id, req.user.id, 'creacion', `Reclamación creada por ${req.user.nombre}`);
    await registrarNotificacion(id, 'cliente', 'estado_cambio', `Tu reclamación ${numero} ha sido registrada.`);
    const r = await db.get('SELECT * FROM reclamaciones WHERE id=?', [id]);
    res.status(201).json(await enriquecer(r));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/estado', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { estado, proveedor_id } = req.body;
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    const r = await db.get('SELECT * FROM reclamaciones WHERE id=?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'No encontrada' });
    await db.run(`UPDATE reclamaciones SET estado=?,updated_at=datetime('now')${proveedor_id?',proveedor_id=?':''} WHERE id=?`,
      proveedor_id ? [estado,proveedor_id,req.params.id] : [estado,req.params.id]);
    await registrarHistorial(req.params.id, req.user.id, 'cambio_estado', `Estado cambiado a "${ESTADO_LABELS[estado]}" por ${req.user.nombre}`);
    await registrarNotificacion(req.params.id, 'cliente', 'estado_cambio', `Tu reclamación ${r.numero} ahora está en estado: ${ESTADO_LABELS[estado]}.`);
    if (estado === 'proveedor') await registrarNotificacion(req.params.id, 'proveedor', 'asignacion', `Se te asignó la reclamación ${r.numero}.`);
    const updated = await db.get(`SELECT r.*,u.nombre as agente_nombre FROM reclamaciones r JOIN usuarios u ON r.agente_id=u.id WHERE r.id=?`, [req.params.id]);
    res.json(await enriquecer(updated));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comentarios', authMiddleware, async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto?.trim()) return res.status(400).json({ error: 'Texto requerido' });
    const r = await db.get('SELECT * FROM reclamaciones WHERE id=?', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'No encontrada' });
    if (req.user.rol === 'proveedor' && r.proveedor_id !== req.user.id) return res.status(403).json({ error: 'Sin acceso' });
    const id = uuidv4();
    await db.run('INSERT INTO comentarios (id,reclamacion_id,usuario_id,texto) VALUES (?,?,?,?)', [id,req.params.id,req.user.id,texto.trim()]);
    await registrarHistorial(req.params.id, req.user.id, 'comentario', `Comentario añadido por ${req.user.nombre}`);
    const comentario = await db.get(`SELECT c.*,u.nombre as usuario_nombre,u.rol as usuario_rol FROM comentarios c JOIN usuarios u ON c.usuario_id=u.id WHERE c.id=?`, [id]);
    res.status(201).json(comentario);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/evidencias/:eid/download', authMiddleware, async (req, res) => {
  try {
    const e = await db.get('SELECT * FROM evidencias WHERE id=? AND reclamacion_id=?', [req.params.eid, req.params.id]);
    if (!e) return res.status(404).json({ error: 'Archivo no encontrado' });
    res.download(path.join(__dirname, '../../uploads', e.nombre_archivo), e.nombre_original);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
