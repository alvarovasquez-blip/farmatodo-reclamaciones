const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware, requireRol } = require('../middleware/auth');
const path = require('path');

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
    let sql = `
      SELECT r.*, u.nombre as agente_nombre,
             p.nombre as proveedor_nombre_usr,
             p.proveedor_nombre as proveedor_empresa
      FROM reclamaciones r
      JOIN usuarios u ON r.agente_id=u.id
      LEFT JOIN usuarios p ON r.proveedor_id=p.id
      WHERE 1=1
    `;
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
    const result = await db.all(`SELECT estado, COUNT(*) as total FROM reclamaciones GROUP BY estado`);
    const stats = { abierto:0, revision:0, proveedor:0, resuelto:0, cerrado:0, total:0 };
    result.forEach(r => { stats[r.estado] = parseInt(r.total); stats.total += parseInt(r.total); });

    const vencidos = await db.get(`SELECT COUNT(*) as total FROM reclamaciones WHERE sla_vencido = TRUE`);
    stats.sla_vencidos_historico = parseInt(vencidos?.total || 0);

    const vencidosActivos = await db.get(`
      SELECT COUNT(*) as total FROM reclamaciones
      WHERE estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 3600) > 24
    `);
    stats.sla_vencidos_activos = parseInt(vencidosActivos?.total || 0);

    const sinRespuesta = await db.get(`
      SELECT COUNT(*) as total FROM reclamaciones
      WHERE primer_respuesta_at IS NULL
      AND estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 60) > 60
    `);
    stats.sla_primer_respuesta_vencidos = parseInt(sinRespuesta?.total || 0);

    stats.tiempo_promedio_horas = null;
    res.json(stats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, proveedor_id } = req.query;

    let whereBase = `WHERE 1=1`;
    const params = [];

    if (fecha_inicio) { whereBase += ` AND r.created_at >= ?`; params.push(fecha_inicio); }
    if (fecha_fin) { whereBase += ` AND r.created_at <= ?`; params.push(fecha_fin + ' 23:59:59'); }
    if (proveedor_id) { whereBase += ` AND r.proveedor_id = ?`; params.push(proveedor_id); }

    const total = await db.get(`SELECT COUNT(*) as total FROM reclamaciones r ${whereBase}`, params);

    const slaVencidos = await db.get(`
      SELECT COUNT(*) as total FROM reclamaciones r
      ${whereBase} AND r.sla_vencido = TRUE
    `, params);

    const slaPrimerRespVencidos = await db.get(`
      SELECT COUNT(*) as total FROM reclamaciones r
      ${whereBase} AND r.sla_primer_respuesta_vencido = TRUE
    `, params);

    const tiempoPrimerResp = await db.get(`
      SELECT AVG(
        EXTRACT(EPOCH FROM (r.primer_respuesta_at::timestamp - r.created_at::timestamp)) / 60
      ) as promedio_minutos
      FROM reclamaciones r
      ${whereBase} AND r.primer_respuesta_at IS NOT NULL
    `, params);

    const tiempoCierre = await db.get(`
      SELECT AVG(
        EXTRACT(EPOCH FROM (r.updated_at::timestamp - r.created_at::timestamp)) / 3600
      ) as promedio_horas
      FROM reclamaciones r
      ${whereBase} AND r.estado IN ('resuelto','cerrado')
    `, params);

    const porEstado = await db.all(`
      SELECT r.estado, COUNT(*) as total
      FROM reclamaciones r ${whereBase}
      GROUP BY r.estado
    `, params);

    const porMotivo = await db.all(`
      SELECT r.motivo, COUNT(*) as total
      FROM reclamaciones r ${whereBase}
      GROUP BY r.motivo
      ORDER BY total DESC
    `, params);

    const porProveedor = await db.all(`
      SELECT
        p.id as proveedor_id,
        p.proveedor_nombre as nombre,
        COUNT(r.id) as total_casos,
        COUNT(CASE WHEN r.estado IN ('resuelto','cerrado') THEN 1 END) as casos_resueltos,
        COUNT(CASE WHEN r.sla_vencido = TRUE THEN 1 END) as sla_vencidos,
        COUNT(CASE WHEN r.sla_primer_respuesta_vencido = TRUE THEN 1 END) as sla_resp_vencidos,
        ROUND(AVG(
          CASE WHEN r.primer_respuesta_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (r.primer_respuesta_at::timestamp - r.created_at::timestamp)) / 60
          END
        )::numeric, 1) as avg_primer_respuesta_min,
        ROUND(AVG(
          CASE WHEN r.estado IN ('resuelto','cerrado')
          THEN EXTRACT(EPOCH FROM (r.updated_at::timestamp - r.created_at::timestamp)) / 3600
          END
        )::numeric, 1) as avg_cierre_horas,
        ROUND(
          COUNT(CASE WHEN r.sla_vencido = TRUE THEN 1 END)::numeric /
          NULLIF(COUNT(r.id), 0) * 100, 1
        ) as pct_sla_vencido
      FROM usuarios p
      LEFT JOIN reclamaciones r ON r.proveedor_id = p.id
        ${fecha_inicio ? `AND r.created_at >= '${fecha_inicio}'` : ''}
        ${fecha_fin ? `AND r.created_at <= '${fecha_fin} 23:59:59'` : ''}
      WHERE p.rol = 'proveedor' AND p.activo = 1
      GROUP BY p.id, p.proveedor_nombre
      ORDER BY total_casos DESC
    `);

    const tendencia = await db.all(`
      SELECT
        to_char(created_at::timestamp, 'YYYY-MM') as mes,
        COUNT(*) as total,
        COUNT(CASE WHEN sla_vencido = TRUE THEN 1 END) as vencidos
      FROM reclamaciones r ${whereBase}
      GROUP BY mes
      ORDER BY mes ASC
      LIMIT 6
    `, params);

    res.json({
      kpis: {
        total: parseInt(total?.total || 0),
        sla_vencidos: parseInt(slaVencidos?.total || 0),
        sla_primer_resp_vencidos: parseInt(slaPrimerRespVencidos?.total || 0),
        pct_sla_vencido: total?.total > 0 ? Math.round(slaVencidos?.total / total?.total * 100) : 0,
        pct_primer_resp_vencido: total?.total > 0 ? Math.round(slaPrimerRespVencidos?.total / total?.total * 100) : 0,
        avg_primer_respuesta_min: tiempoPrimerResp?.promedio_minutos ? Math.round(parseFloat(tiempoPrimerResp.promedio_minutos) * 10) / 10 : null,
        avg_cierre_horas: tiempoCierre?.promedio_horas ? Math.round(parseFloat(tiempoCierre.promedio_horas) * 10) / 10 : null,
      },
      por_estado: porEstado,
      por_motivo: porMotivo,
      por_proveedor: porProveedor,
      tendencia
    });
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
    await db.run(`INSERT INTO reclamaciones (id,numero,orden,guia,titular,fecha_solicitud,motivo,descripcion,medio_reembolso,agente_id,sla_vencido,sla_primer_respuesta_vencido) VALUES (?,?,?,?,?,?,?,?,?,?,FALSE,FALSE)`,
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
    await db.run(`UPDATE reclamaciones SET estado=?,updated_at=NOW() WHERE id=?`, [estado, req.params.id]);
    if (proveedor_id) await db.run(`UPDATE reclamaciones SET proveedor_id=? WHERE id=?`, [proveedor_id, req.params.id]);
    await registrarHistorial(req.params.id, req.user.id, 'cambio_estado', `Estado cambiado a "${ESTADO_LABELS[estado]}" por ${req.user.nombre}`);
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

    if (req.user.rol === 'agente_sac' && !r.primer_respuesta_at) {
      const ahora = new Date().toISOString();
      const minutos = (Date.now() - new Date(r.created_at).getTime()) / 60000;
      await db.run(`UPDATE reclamaciones SET primer_respuesta_at=?, sla_primer_respuesta_vencido=? WHERE id=?`,
        [ahora, minutos > 60, req.params.id]);
      await registrarHistorial(req.params.id, req.user.id, 'primer_respuesta',
        `Primera respuesta del agente en ${Math.round(minutos)} minuto(s) — SLA ${minutos > 60 ? 'VENCIDO' : 'cumplido'}`);
    }

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
