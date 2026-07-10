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

async function enviarEmail(to, subject, html) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Farmatodo Reclamaciones <onboarding@resend.dev>',
        to, subject, html
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    console.log(`📬 Email enviado a ${to}`);
  } catch(e) {
    console.error(`❌ Error enviando email a ${to}:`, e.message);
  }
}

async function marcarSLAVencidos() {
  try {
    // 1. Marcar SLA de resolución vencidos (>24h)
    const r1 = await db.run(`
      UPDATE reclamaciones
      SET sla_vencido = TRUE,
          sla_vencido_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      WHERE sla_vencido = FALSE
      AND estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 3600) > 24
    `);
    if (r1.rowCount > 0) console.log(`⏱ SLA resolución: ${r1.rowCount} caso(s) vencidos`);

    // 2. Marcar SLA de primer respuesta vencidos (>60 min)
    const r2 = await db.run(`
      UPDATE reclamaciones
      SET sla_primer_respuesta_vencido = TRUE
      WHERE sla_primer_respuesta_vencido = FALSE
      AND primer_respuesta_at IS NULL
      AND estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 60) > 60
    `);
    if (r2.rowCount > 0) console.log(`⏱ SLA primer respuesta: ${r2.rowCount} caso(s) vencidos`);

    // 3. Alertar al PROVEEDOR — SLA resolución a punto de vencer (entre 20h y 21h transcurridas = 4h antes de las 24h)
    const porVencerProveedor = await db.all(`
      SELECT r.*, u.email as agente_email, u.nombre as agente_nombre,
             p.email as proveedor_email, p.nombre as proveedor_nombre_real
      FROM reclamaciones r
      JOIN usuarios u ON r.agente_id = u.id
      LEFT JOIN usuarios p ON r.proveedor_id = p.id
      WHERE r.estado = 'proveedor'
      AND r.sla_vencido = FALSE
      AND r.proveedor_id IS NOT NULL
      AND (EXTRACT(EPOCH FROM (NOW() - r.created_at::timestamp)) / 3600) BETWEEN 20 AND 21
      AND NOT EXISTS (
        SELECT 1 FROM notificaciones n
        WHERE n.reclamacion_id = r.id
        AND n.tipo = 'sla_alerta_proveedor'
        AND n.created_at > to_char(NOW() - INTERVAL '2 hours', 'YYYY-MM-DD HH24:MI:SS')
      )
    `);

    for (const rec of porVencerProveedor) {
      if (rec.proveedor_email) {
        await enviarEmail(
          rec.proveedor_email,
          `⚠️ Reclamación ${rec.numero} vence en 4 horas — Farmatodo`,
          `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <div style="background:#0C3D74;padding:20px;border-radius:8px 8px 0 0;text-align:center">
              <h2 style="color:white;margin:0;font-size:18px">Farmatodo · Reclamaciones</h2>
            </div>
            <div style="background:#fff8f0;padding:28px;border-radius:0 0 8px 8px;border:1px solid #FAC775">
              <p style="color:#333;font-size:15px">⚠️ <strong>Alerta de SLA</strong></p>
              <p style="color:#555;font-size:14px">La reclamación <strong>${rec.numero}</strong> vence en aproximadamente <strong>4 horas</strong>.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
                <tr><td style="padding:6px;color:#888">Orden:</td><td style="padding:6px;font-weight:600">${rec.orden}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:6px;color:#888">Titular:</td><td style="padding:6px">${rec.titular}</td></tr>
                <tr><td style="padding:6px;color:#888">Motivo:</td><td style="padding:6px">${rec.motivo}</td></tr>
              </table>
              <div style="text-align:center;margin:20px 0">
                <a href="https://farmatodo-reclamacionesmkp.lovable.app" style="background:#0C3D74;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                  Ver reclamación
                </a>
              </div>
              <p style="color:#999;font-size:12px">Por favor responde antes de que venza el plazo.</p>
            </div>
          </div>
          `
        );
        await db.run(`INSERT INTO notificaciones (id,reclamacion_id,destinatario,tipo,mensaje) VALUES (?,?,?,?,?)`,
          [require('crypto').randomUUID(), rec.id, rec.proveedor_email, 'sla_alerta_proveedor', `Alerta SLA enviada al proveedor para ${rec.numero}`]);
      }
    }

    // 4. Alertar al AGENTE — SLA primer respuesta a punto de vencer (entre 50 y 51 min = 10 min antes de 60 min)
    const porVencerAgente = await db.all(`
      SELECT r.*, u.email as agente_email, u.nombre as agente_nombre
      FROM reclamaciones r
      JOIN usuarios u ON r.agente_id = u.id
      WHERE r.primer_respuesta_at IS NULL
      AND r.sla_primer_respuesta_vencido = FALSE
      AND r.estado NOT IN ('resuelto','cerrado')
      AND (EXTRACT(EPOCH FROM (NOW() - r.created_at::timestamp)) / 60) BETWEEN 50 AND 51
      AND NOT EXISTS (
        SELECT 1 FROM notificaciones n
        WHERE n.reclamacion_id = r.id
        AND n.tipo = 'sla_alerta_agente'
        AND n.created_at > to_char(NOW() - INTERVAL '1 hour', 'YYYY-MM-DD HH24:MI:SS')
      )
    `);

    for (const rec of porVencerAgente) {
      await enviarEmail(
        rec.agente_email,
        `⚠️ Reclamación ${rec.numero} sin primera respuesta — vence en 10 minutos`,
        `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <div style="background:#0C3D74;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h2 style="color:white;margin:0;font-size:18px">Farmatodo · Reclamaciones</h2>
          </div>
          <div style="background:#fff0f2;padding:28px;border-radius:0 0 8px 8px;border:1px solid #F5C0C8">
            <p style="color:#333;font-size:15px">🚨 <strong>SLA de primera respuesta</strong></p>
            <p style="color:#555;font-size:14px">Hola <strong>${rec.agente_nombre}</strong>, la reclamación <strong>${rec.numero}</strong> lleva 50 minutos sin respuesta. Tienes <strong>10 minutos</strong> para responder.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
              <tr><td style="padding:6px;color:#888">Orden:</td><td style="padding:6px;font-weight:600">${rec.orden}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:6px;color:#888">Titular:</td><td style="padding:6px">${rec.titular}</td></tr>
              <tr><td style="padding:6px;color:#888">Motivo:</td><td style="padding:6px">${rec.motivo}</td></tr>
            </table>
            <div style="text-align:center;margin:20px 0">
              <a href="https://farmatodo-reclamacionesmkp.lovable.app" style="background:#B5122B;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                Responder ahora
              </a>
            </div>
          </div>
        </div>
        `
      );
      await db.run(`INSERT INTO notificaciones (id,reclamacion_id,destinatario,tipo,mensaje) VALUES (?,?,?,?,?)`,
        [require('crypto').randomUUID(), rec.id, rec.agente_email, 'sla_alerta_agente', `Alerta SLA primer respuesta enviada al agente para ${rec.numero}`]);
    }

  } catch(e) {
    console.error('Error en job SLA:', e.message);
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
