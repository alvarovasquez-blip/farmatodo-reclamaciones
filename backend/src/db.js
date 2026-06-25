const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
  async run(sql, params = []) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const res = await pool.query(pgSql, params);
    return res;
  },
  async get(sql, params = []) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || null;
  },
  async all(sql, params = []) {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const res = await pool.query(pgSql, params);
    return res.rows;
  },
  async exec(sql) {
    await pool.query(sql);
  }
};

async function init() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      proveedor_nombre TEXT,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS reclamaciones (
      id TEXT PRIMARY KEY,
      numero TEXT UNIQUE NOT NULL,
      orden TEXT NOT NULL,
      guia TEXT,
      titular TEXT NOT NULL,
      fecha_solicitud TEXT NOT NULL,
      motivo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'abierto',
      medio_reembolso TEXT,
      proveedor_id TEXT REFERENCES usuarios(id),
      agente_id TEXT NOT NULL REFERENCES usuarios(id),
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      updated_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS historial (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      usuario_id TEXT REFERENCES usuarios(id),
      tipo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS comentarios (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      usuario_id TEXT NOT NULL REFERENCES usuarios(id),
      texto TEXT NOT NULL,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS evidencias (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      usuario_id TEXT NOT NULL REFERENCES usuarios(id),
      nombre_original TEXT NOT NULL,
      nombre_archivo TEXT NOT NULL,
      tipo_mime TEXT NOT NULL,
      tamano INTEGER NOT NULL,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
    CREATE TABLE IF NOT EXISTS notificaciones (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      destinatario TEXT NOT NULL,
      tipo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      enviada INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
  `);

  const count = await db.get('SELECT COUNT(*) as c FROM usuarios');
  if (parseInt(count.c) === 0) {
    const hash = (p) => bcrypt.hashSync(p, 10);
    const ins = `INSERT INTO usuarios (id,nombre,email,password_hash,rol,proveedor_nombre) VALUES (?,?,?,?,?,?)`;
    await db.run(ins, [uuidv4(),'María Agudelo','magudelo@farmatodo.com',hash('farmatodo123'),'agente_sac',null]);
    await db.run(ins, [uuidv4(),'Juan Pérez','jperez@farmatodo.com',hash('farmatodo123'),'agente_sac',null]);
    await db.run(ins, [uuidv4(),'Laboratorios Bayer','bayer@proveedores.farmatodo.com',hash('bayer123'),'proveedor','Laboratorios Bayer']);
    await db.run(ins, [uuidv4(),'Novartis Colombia','novartis@proveedores.farmatodo.com',hash('novartis123'),'proveedor','Novartis Colombia']);
    console.log('✅ Usuarios seed creados');
  }
  console.log('✅ Base de datos PostgreSQL lista');
}

module.exports = { db, init };
