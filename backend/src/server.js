require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { init, db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

async function marcarSLAVencidos() {
  try {
    const r1 = await db.run(`
      UPDATE reclamaciones
      SET sla_vencido = TRUE,
          sla_vencido_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      WHERE sla_vencido = FALSE
      AND estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 3600) > 24
    `);
    if (r1.rowCount > 0) console.log(`⏱ SLA resolución: ${r1.rowCount} caso(s) vencidos`);

    const r2 = await db.run(`
      UPDATE reclamaciones
      SET sla_primer_respuesta_vencido = TRUE
      WHERE sla_primer_respuesta_vencido = FALSE
      AND primer_respuesta_at IS NULL
      AND estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 60) > 60
    `);
    if (r2.rowCount > 0) console.log(`⏱ SLA primer respuesta: ${r2.rowCount} caso(s) vencidos`);
  } catch(e) {
    console.error('Error marcando SLA:', e.message);
  }
}

async function start() {
  await init();

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/reclamaciones', require('./routes/reclamaciones'));
  app.use('/api/reclamaciones/:id/evidencias', require('./routes/evidencias'));
  app.use('/api/usuarios', require('./routes/usuarios'));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../../frontend/dist/index.html')));
  }

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  await marcarSLAVencidos();
  setInterval(marcarSLAVencidos, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
