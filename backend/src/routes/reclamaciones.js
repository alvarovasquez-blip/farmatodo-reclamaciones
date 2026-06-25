const router = require('express').Router();router.get('/stats', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const result = await db.all(`
      SELECT estado, COUNT(*) as total FROM reclamaciones GROUP BY estado
    `);
    const stats = { abierto:0, revision:0, proveedor:0, resuelto:0, cerrado:0, total:0 };
    result.forEach(r => {
      stats[r.estado] = parseInt(r.total);
      stats.total += parseInt(r.total);
    });
    const avg = await db.get(`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at::timestamp - created_at::timestamp))/3600) as avg_horas
      FROM reclamaciones WHERE estado IN ('resuelto','cerrado')
    `);
    stats.tiempo_promedio_horas = avg && avg.avg_horas ? Math.round(parseFloat(avg.avg_horas)*10)/10 : null;
    res.json(stats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
