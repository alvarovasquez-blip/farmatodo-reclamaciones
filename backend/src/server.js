require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

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

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
