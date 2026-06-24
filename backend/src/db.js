const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Usamos sqlite3 (precompilado para Linux x64 en npm)
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = path.join(DATA_DIR, 'farmatodo.db');
const rawDb = new sqlite3.Database(DB_PATH);

// Wrapper síncrono sobre sqlite3 async para mantener la misma API
const db = {
  _db: rawDb,
  run(sql, params = []) {
    return new Promise((res, rej) => rawDb.run(sql, params, function(err) {
      if (err) rej(err); else res({ lastID: this.lastID, changes: this.changes });
    }));
  },
  get(sql, params = []) {
    return new Promise((res, rej) => rawDb.get(sql, params, (err, row) => err ? rej(err) : res(row)));
  },
  all(sql, params = []) {
    return new Promise((res, rej) => rawDb.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
  },
  exec(sql) {
    return new Promise((res, rej) => rawDb.exec(sql, err => err ? rej(err) : res()));
  }
};

async function init() {
  await db.exec(`PRAGMA foreign_keys = ON;`);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('agente_sac','proveedor')),
      activo INTEGER DEFAULT 1,
      proveedor_nombre TEXT,
      created_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS historial (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      usuario_id TEXT REFERENCES usuarios(id),
      tipo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS comentarios (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      usuario_id TEXT NOT NULL REFERENCES usuarios(id),
      texto TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS evidencias (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      usuario_id TEXT NOT NULL REFERENCES usuarios(id),
      nombre_original TEXT NOT NULL,
      nombre_archivo TEXT NOT NULL,
      tipo_mime TEXT NOT NULL,
      tamano INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notificaciones (
      id TEXT PRIMARY KEY,
      reclamacion_id TEXT NOT NULL REFERENCES reclamaciones(id),
      destinatario TEXT NOT NULL,
      tipo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      enviada INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const count = await db.get('SELECT COUNT(*) as c FROM usuarios');
  if (count.c === 0) {
    const hash = (p) => bcrypt.hashSync(p, 10);
    const ins = `INSERT INTO usuarios (id,nombre,email,password_hash,rol,proveedor_nombre) VALUES (?,?,?,?,?,?)`;
    await db.run(ins, [uuidv4(),'María Agudelo','magudelo@farmatodo.com',hash('farmatodo123'),'agente_sac',null]);
    await db.run(ins, [uuidv4(),'Juan Pérez','jperez@farmatodo.com',hash('farmatodo123'),'agente_sac',null]);
    await db.run(ins, [uuidv4(),'Laboratorios Bayer','bayer@proveedores.farmatodo.com',hash('bayer123'),'proveedor','Laboratorios Bayer']);
    await db.run(ins, [uuidv4(),'Novartis Colombia','novartis@proveedores.farmatodo.com',hash('novartis123'),'proveedor','Novartis Colombia']);
    console.log('✅ Usuarios seed creados');
    console.log('   Agente SAC:  magudelo@farmatodo.com / farmatodo123');
    console.log('   Proveedor:   bayer@proveedores.farmatodo.com / bayer123');
  }
  console.log('✅ Base de datos lista');
}

module.exports = { db, init };
