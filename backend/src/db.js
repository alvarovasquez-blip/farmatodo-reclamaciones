farmatodo/                                                                                          0000755 0000000 0000000 00000000000 15217016766 011543  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/render.yaml                                                                               0000644 0000000 0000000 00000001043 15217016762 013700  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   services:
  - type: web
    name: farmatodo-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: node src/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        sync: false

  - type: static
    name: farmatodo-frontend
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             farmatodo/frontend/                                                                                 0000755 0000000 0000000 00000000000 15217006616 013353  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/frontend/vite.config.js                                                                   0000644 0000000 0000000 00000000376 15217006611 016125  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})
                                                                                                                                                                                                                                                                  farmatodo/frontend/src/                                                                             0000755 0000000 0000000 00000000000 15217032141 014132  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/frontend/src/ProveedorView.jsx                                                            0000644 0000000 0000000 00000006201 15217032141 017457  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState, useEffect } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { StatusBadge } from './components';
import DetailPanel from './DetailPanel';

export default function ProveedorView() {
  const { user } = useAuth();
  const toast = useToast();
  const [casos, setCasos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getReclamaciones();
      setCasos(data.reclamaciones);
    } catch(e) { toast(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="prov-header">
          <div className="logo-icon" style={{ width: 28, height: 28 }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 14 }}><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Portal de proveedores</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user.proveedor_nombre}</div>
          </div>
          <span className="prov-badge" style={{ marginLeft: 'auto' }}>Proveedor</span>
        </div>

        <div className="content">
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
            Casos asignados a tu empresa que requieren respuesta o evidencia adjunta.
          </p>

          {loading ? (
            <div className="loader">Cargando casos…</div>
          ) : casos.length === 0 ? (
            <div className="empty"><p>No tienes casos activos asignados en este momento.</p></div>
          ) : casos.map(c => (
            <div key={c.id} className={`prov-case ${selectedId === c.id ? 'selected' : ''}`} onClick={() => setSelectedId(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>
                  {c.numero} · {c.orden}
                </span>
                <StatusBadge estado={c.estado}/>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{c.motivo}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{c.titular} · {c.fecha_solicitud}</div>
              <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}>
                Ver detalles y responder
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedId && (
        <DetailPanel
          reclamacionId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => load()}
          proveedores={[]}
        />
      )}
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                               farmatodo/frontend/src/ToastContext.jsx                                                             0000644 0000000 0000000 00000001505 15217032141 017320  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, duration = 2500) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
                                                                                                                                                                                           farmatodo/frontend/src/NuevaReclamacion.jsx                                                         0000644 0000000 0000000 00000013425 15217032141 020101  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState } from 'react';
import { api } from './api';
import { useToast } from './ToastContext';

const MOTIVOS_REEMBOLSO = ['Pedido incompleto', 'Retracto de compra', 'Pedido no llega', 'Calidad de producto'];

export default function NuevaReclamacion({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    orden: '', titular: '', fecha_solicitud: new Date().toISOString().split('T')[0],
    motivo: '', descripcion: '', guia: '', medio_reembolso: '', despachado: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const needsReembolso = MOTIVOS_REEMBOLSO.includes(form.motivo);
  const needsGuia = form.despachado === 'si';

  async function handleSubmit() {
    if (!form.orden.trim() || !form.titular.trim() || !form.motivo || !form.descripcion.trim()) {
      toast('Completa todos los campos obligatorios'); return;
    }
    setLoading(true);
    try {
      const payload = {
        orden: form.orden.trim(), titular: form.titular.trim(),
        fecha_solicitud: form.fecha_solicitud, motivo: form.motivo,
        descripcion: form.descripcion.trim(),
        guia: needsGuia && form.guia ? form.guia.trim() : undefined,
        medio_reembolso: needsReembolso && form.medio_reembolso ? form.medio_reembolso : undefined,
      };
      const rec = await api.crearReclamacion(payload);
      toast('Reclamación creada exitosamente');
      onCreated(rec);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Nueva reclamación</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">N° de orden <span className="required">*</span></label>
              <input className="form-control" placeholder="ORD-2024-00891" value={form.orden} onChange={e => set('orden', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de solicitud <span className="required">*</span></label>
              <input className="form-control" type="date" value={form.fecha_solicitud} onChange={e => set('fecha_solicitud', e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Titular del pedido <span className="required">*</span></label>
            <input className="form-control" placeholder="Nombre completo del cliente" value={form.titular} onChange={e => set('titular', e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Motivo de reclamación <span className="required">*</span></label>
            <select className="form-control" value={form.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="">Seleccionar motivo…</option>
              {['Pedido incompleto','Retracto de compra','Pedido no llega','Calidad de producto','Producto equivocado','Otro'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">¿El pedido fue despachado?</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              {['si','no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="despachado" value={v} checked={form.despachado === v} onChange={() => set('despachado', v)}/> {v === 'si' ? 'Sí' : 'No'}
                </label>
              ))}
            </div>
          </div>

          {needsGuia && (
            <div className="form-group">
              <div className="conditional-block">
                <label className="form-label" style={{ marginBottom: 8 }}>Número de guía de envío</label>
                <input className="form-control" placeholder="TCC-849201847" value={form.guia} onChange={e => set('guia', e.target.value)}/>
              </div>
            </div>
          )}

          {needsReembolso && (
            <div className="form-group">
              <div className="conditional-block">
                <label className="form-label" style={{ marginBottom: 10 }}>Medio de reembolso</label>
                <div className="medio-options">
                  {['Bre-B','Nequi','Cupon Farmatodo'].map(m => (
                    <button key={m} type="button" className={`medio-opt ${form.medio_reembolso === m ? 'selected' : ''}`}
                      onClick={() => set('medio_reembolso', m)}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Descripción <span className="required">*</span></label>
            <textarea className="form-control" rows="3" placeholder="Describe brevemente lo sucedido…"
              value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              style={{ resize: 'none' }}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando…' : 'Crear reclamación'}
          </button>
        </div>
      </div>
    </div>
  );
}
                                                                                                                                                                                                                                           farmatodo/frontend/src/components.jsx                                                               0000644 0000000 0000000 00000004751 15217032141 017054  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   export function StatusBadge({ estado }) {
  const map = {
    abierto: { cls: 's-abierto', label: 'Abierto' },
    revision: { cls: 's-revision', label: 'En revisión' },
    proveedor: { cls: 's-proveedor', label: 'Pend. proveedor' },
    resuelto: { cls: 's-resuelto', label: 'Resuelto' },
    cerrado: { cls: 's-cerrado', label: 'Cerrado' },
  };
  const d = map[estado] || { cls: 's-abierto', label: estado };
  return <span className={`status ${d.cls}`}><span className="status-dot" />{d.label}</span>;
}

export function Avatar({ nombre, size = 30, bg = 'var(--blue-light)', color = 'var(--blue)' }) {
  const initials = nombre ? nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600, color, flexShrink: 0
    }}>{initials}</div>
  );
}

export function ActorTag({ rol }) {
  const map = { agente_sac: ['actor-agente_sac', 'SAC'], proveedor: ['actor-proveedor', 'Proveedor'], sistema: ['actor-sistema', 'Sistema'] };
  const [cls, label] = map[rol] || ['actor-sistema', rol];
  return <span className={`actor-tag ${cls}`}>{label}</span>;
}

export function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
}
export function IconClose() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;
}
export function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
}
export function IconFile() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;
}
export function IconImg() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 5 5 3-3 6 6"/></svg>;
}
export function IconUpload() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>;
}
                       farmatodo/frontend/src/index.css                                                                    0000644 0000000 0000000 00000034600 15217032141 015756  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:#0C3D74;--primary-light:#E8EEF6;--primary-dark:#082D57;
  --bg:#F7F7F8;--surface:#FFFFFF;--surface2:#F2F2F4;
  --border:#E5E5E8;--border2:#D0D0D5;
  --text:#111118;--text2:#5A5A6A;--text3:#9898A8;
  --blue:#185FA5;--blue-light:#E6F1FB;
  --amber:#BA7517;--amber-light:#FAEEDA;
  --purple:#534AB7;--purple-light:#EEEDFE;
  --green:#0F6E56;--green-light:#E1F5EE;
  --gray:#5F5E5A;--gray-light:#F1EFE8;
  --radius:8px;--radius-lg:12px;
  --shadow:0 1px 3px rgba(0,0,0,.07);
}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5}
button{font-family:'Inter',sans-serif;cursor:pointer}
input,select,textarea{font-family:'Inter',sans-serif}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:10px}

/* Layout */
.app-layout{display:flex;height:100vh;overflow:hidden}
.sidebar{width:220px;min-width:220px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100vh}
.main-area{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:56px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:12px;flex-shrink:0}
.content{flex:1;overflow-y:auto;padding:24px}

/* Sidebar */
.logo{padding:18px 18px 14px;border-bottom:1px solid var(--border)}
.logo-mark{display:flex;align-items:center;gap:8px}
.logo-icon{width:32px;height:32px;background:var(--primary);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-icon svg{width:18px;height:18px;fill:white}
.logo-text{font-size:13px;font-weight:600;color:var(--text)}
.logo-sub{font-size:11px;color:var(--text3);margin-top:1px}
.nav{padding:10px 8px;flex:1}
.nav-section{font-size:10px;font-weight:600;color:var(--text3);letter-spacing:.07em;text-transform:uppercase;padding:8px 10px 6px}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--radius);cursor:pointer;font-size:13px;color:var(--text2);transition:all .15s;margin-bottom:1px;border:none;background:transparent;width:100%;text-align:left}
.nav-item:hover{background:var(--bg);color:var(--text)}
.nav-item.active{background:var(--primary-light);color:var(--primary);font-weight:500}
.nav-item svg{width:16px;height:16px;flex-shrink:0}
.nav-badge{margin-left:auto;background:var(--primary);color:white;font-size:10px;font-weight:600;padding:1px 6px;border-radius:20px}
.sidebar-user{padding:12px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:9px}
.user-avatar{width:30px;height:30px;border-radius:50%;background:var(--blue-light);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--blue);flex-shrink:0}
.user-name{font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-role{font-size:11px;color:var(--text3)}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--radius);font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;border:1px solid transparent}
.btn-primary{background:var(--primary);color:white;border-color:var(--primary)}
.btn-primary:hover{background:var(--primary-dark)}
.btn-secondary{background:var(--surface);color:var(--text2);border-color:var(--border2)}
.btn-secondary:hover{background:var(--bg)}
.btn-sm{padding:5px 10px;font-size:12px}
.btn svg{width:14px;height:14px}
.btn:disabled{opacity:.5;cursor:not-allowed}

/* Forms */
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:12px;font-weight:500;color:var(--text2);margin-bottom:6px}
.required{color:var(--primary);margin-left:2px}
.form-control{width:100%;border:1px solid var(--border2);border-radius:var(--radius);padding:8px 12px;font-size:13px;color:var(--text);outline:none;transition:border-color .15s;background:white}
.form-control:focus{border-color:var(--primary)}
.form-control::placeholder{color:var(--text3)}
.form-hint{font-size:11px;color:var(--text3);margin-top:4px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.conditional-block{background:var(--surface2);border-radius:var(--radius);padding:14px;margin-top:4px;border:1px solid var(--border)}

/* Status badges */
.status{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
.status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.s-abierto{background:#E6F1FB;color:#185FA5}.s-abierto .status-dot{background:#378ADD}
.s-revision{background:var(--amber-light);color:var(--amber)}.s-revision .status-dot{background:#EF9F27}
.s-proveedor{background:var(--purple-light);color:var(--purple)}.s-proveedor .status-dot{background:#7F77DD}
.s-resuelto{background:var(--green-light);color:var(--green)}.s-resuelto .status-dot{background:#1D9E75}
.s-cerrado{background:var(--gray-light);color:var(--gray)}.s-cerrado .status-dot{background:#888780}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px 16px}
.stat-num{font-size:22px;font-weight:600;color:var(--text);line-height:1}
.stat-label{font-size:11px;color:var(--text3);margin-top:4px}

/* Filters & tabs */
.tabs{display:flex;gap:2px;background:var(--surface2);padding:3px;border-radius:var(--radius);width:fit-content;margin-bottom:18px}
.tab{padding:5px 14px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text2);transition:all .15s;border:none;background:transparent}
.tab.active{background:white;color:var(--text);box-shadow:var(--shadow)}
.filters{display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap}
.filter-chip{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border2);background:var(--surface);color:var(--text2);transition:all .15s}
.filter-chip.active{background:var(--primary-light);color:var(--primary);border-color:#B8CCE4}
.search-box{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border2);border-radius:var(--radius);padding:6px 12px;margin-left:auto}
.search-box svg{width:14px;height:14px;color:var(--text3)}
.search-box input{border:none;outline:none;font-size:13px;color:var(--text);background:transparent;width:180px}
.search-box input::placeholder{color:var(--text3)}

/* Table */
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
table{width:100%;border-collapse:collapse}
thead tr{background:var(--surface2);border-bottom:1px solid var(--border)}
th{padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
tbody tr{border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:#FAFAFA}
tbody tr.selected{background:#FFF8F8}
td{padding:12px 16px;font-size:13px;color:var(--text2)}
.td-order{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text);font-weight:500}
.td-name{color:var(--text);font-weight:500}
.motivo-chip{display:inline-block;padding:2px 8px;border-radius:5px;font-size:11px;background:var(--surface2);color:var(--text2);border:1px solid var(--border)}

/* Detail Panel */
.panel{width:540px;min-width:540px;background:var(--surface);border-left:1px solid var(--border);height:100vh;display:flex;flex-direction:column;overflow:hidden;transition:all .2s}
.panel.hidden{width:0;min-width:0;overflow:hidden}
.panel-header{padding:18px 20px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
.panel-order{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text3);margin-bottom:4px}
.panel-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:8px}
.panel-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.panel-body{flex:1;overflow-y:auto;padding:18px 20px}
.panel-section{margin-bottom:22px}
.panel-section-title{font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)}

/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.info-item label{font-size:11px;color:var(--text3);display:block;margin-bottom:3px;font-weight:500}
.info-item span{font-size:13px;color:var(--text);font-weight:500}
.mono{font-family:'JetBrains Mono',monospace;font-size:12px}
.reembolso-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--green-light);border:1px solid #9FE1CB;border-radius:var(--radius);font-size:12px;color:var(--green);font-weight:500}

/* Estado selector */
.estado-selector{display:flex;gap:6px;flex-wrap:wrap}
.estado-btn{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--surface);color:var(--text2);transition:all .15s}
.estado-btn:hover{background:var(--bg)}
.estado-btn.sel-abierto{background:#E6F1FB;color:#185FA5;border-color:#B5D4F4}
.estado-btn.sel-revision{background:var(--amber-light);color:var(--amber);border-color:#FAC775}
.estado-btn.sel-proveedor{background:var(--purple-light);color:var(--purple);border-color:#CECBF6}
.estado-btn.sel-resuelto{background:var(--green-light);color:var(--green);border-color:#9FE1CB}
.estado-btn.sel-cerrado{background:var(--gray-light);color:var(--gray);border-color:#D3D1C7}

/* Timeline */
.timeline{position:relative;padding-left:22px}
.timeline::before{content:'';position:absolute;left:6px;top:6px;bottom:6px;width:1px;background:var(--border)}
.tl-item{position:relative;margin-bottom:14px}
.tl-dot{position:absolute;left:-22px;top:3px;width:13px;height:13px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px var(--border2)}
.tl-date{font-size:11px;color:var(--text3);margin-bottom:2px}
.tl-text{font-size:13px;color:var(--text);line-height:1.5}
.actor-tag{display:inline-block;font-size:10px;padding:1px 6px;border-radius:4px;margin-left:4px;font-weight:500}
.actor-agente_sac{background:var(--blue-light);color:var(--blue)}
.actor-proveedor{background:var(--purple-light);color:var(--purple)}
.actor-sistema{background:var(--gray-light);color:var(--gray)}

/* Comentarios */
.comment-card{background:var(--surface2);border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;border-left:3px solid var(--border2)}
.comment-card.prov{border-left-color:#7F77DD;background:var(--purple-light)}
.comment-header{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.comment-author{font-size:12px;font-weight:600;color:var(--text)}
.comment-date{font-size:11px;color:var(--text3);margin-left:auto}
.comment-text{font-size:13px;color:var(--text2);line-height:1.5}

/* Evidencias */
.ev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ev-item{border:1px solid var(--border);border-radius:var(--radius);padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:all .15s;background:var(--surface)}
.ev-item:hover{border-color:var(--border2);background:var(--bg)}
.ev-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.ev-name{font-size:11px;color:var(--text2);text-align:center;word-break:break-word;line-height:1.3}
.ev-by{font-size:10px;color:var(--text3)}
.ev-upload{border:1.5px dashed var(--border2);border-radius:var(--radius);padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:all .15s;background:transparent}
.ev-upload:hover{border-color:var(--primary);background:var(--primary-light)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:100}
.modal{background:white;border-radius:var(--radius-lg);width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18)}
.modal-header{padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:1}
.modal-title{font-size:16px;font-weight:600;color:var(--text)}
.modal-body{padding:20px 24px}
.modal-footer{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;position:sticky;bottom:0;background:white}
.medio-options{display:flex;gap:8px;flex-wrap:wrap}
.medio-opt{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1.5px solid var(--border2);background:white;color:var(--text2);transition:all .15s}
.medio-opt.selected{background:var(--green-light);color:var(--green);border-color:#9FE1CB}

/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:#111;color:white;padding:10px 16px;border-radius:var(--radius);font-size:13px;z-index:200;animation:slideUp .25s ease}
@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Login */
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)}
.login-card{background:white;border-radius:var(--radius-lg);padding:40px;width:380px;border:1px solid var(--border);box-shadow:var(--shadow)}
.login-logo{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.login-title{font-size:22px;font-weight:600;color:var(--text);margin-bottom:4px}
.login-sub{font-size:14px;color:var(--text3);margin-bottom:24px}
.error-msg{background:#E8EEF6;border:1px solid #B8CCE4;color:var(--primary);padding:10px 14px;border-radius:var(--radius);font-size:13px;margin-bottom:16px}

/* Proveedor portal */
.prov-header{background:var(--surface);border-bottom:1px solid var(--border);padding:14px 24px;display:flex;align-items:center;gap:12px}
.prov-badge{background:var(--purple-light);color:var(--purple);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.prov-case{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;margin-bottom:12px;transition:all .15s}
.prov-case:hover{border-color:var(--border2);box-shadow:var(--shadow)}

/* Loader */
.loader{display:flex;align-items:center;justify-content:center;padding:60px;color:var(--text3);font-size:13px}

/* Empty state */
.empty{text-align:center;padding:60px 20px;color:var(--text3)}
.empty p{font-size:14px}
                                                                                                                                farmatodo/frontend/src/App.jsx                                                                      0000644 0000000 0000000 00000006433 15217032140 015405  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Avatar } from './components';
import Bandeja from './Bandeja';
import Proveedores from './Proveedores';
import ProveedorView from './ProveedorView';

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      {label}
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

const IconBandeja = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>;
const IconUsers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IconLogout = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('bandeja');

  if (user.rol === 'proveedor') {
    return (
      <div className="app-layout">
        <ProveedorView />
        <div style={{ position: 'fixed', bottom: 16, right: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={logout}><IconLogout/> Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3a3 3 0 110 6 3 3 0 010-6zm6 13H6v-.5c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/></svg>
            </div>
            <div>
              <div className="logo-text">Farmatodo</div>
              <div className="logo-sub">Reclamaciones</div>
            </div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section">Principal</div>
          <NavItem icon={<IconBandeja/>} label="Bandeja de casos" active={view === 'bandeja'} onClick={() => setView('bandeja')}/>
          <div className="nav-section">Gestión</div>
          <NavItem icon={<IconUsers/>} label="Proveedores" active={view === 'proveedores'} onClick={() => setView('proveedores')}/>
        </nav>

        <div className="sidebar-user">
          <Avatar nombre={user.nombre} size={30}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user.nombre}</div>
            <div className="user-role">Agente SAC</div>
          </div>
          <button title="Cerrar sesión" onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
            <IconLogout/>
          </button>
        </div>
      </div>

      <div className="main-area">
        {view === 'bandeja' && <Bandeja/>}
        {view === 'proveedores' && <Proveedores/>}
      </div>
    </div>
  );
}
                                                                                                                                                                                                                                     farmatodo/frontend/src/Bandeja.jsx                                                                  0000644 0000000 0000000 00000014316 15217032141 016211  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState, useEffect } from 'react';
import { api } from './api';
import { useToast } from './ToastContext';
import { StatusBadge, Avatar, IconSearch, IconPlus } from './components';
import NuevaReclamacion from './NuevaReclamacion';
import DetailPanel from './DetailPanel';

const TABS = [
  { k: 'todos', label: 'Todos' },
  { k: 'abierto', label: 'Abiertos' },
  { k: 'revision', label: 'En revisión' },
  { k: 'proveedor', label: 'Pend. proveedor' },
  { k: 'resuelto', label: 'Resueltos' },
];
const MOTIVOS = ['Pedido incompleto', 'Retracto de compra', 'Pedido no llega', 'Calidad de producto', 'Producto equivocado', 'Otro'];

export default function Bandeja() {
  const toast = useToast();
  const [casos, setCasos] = useState([]);
  const [stats, setStats] = useState({});
  const [proveedores, setProveedores] = useState([]);
  const [tab, setTab] = useState('todos');
  const [motivo, setMotivo] = useState('');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [tab, motivo, q]);
  useEffect(() => { api.getUsuarios('proveedor').then(d => setProveedores(d.usuarios)).catch(()=>{}); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [casosData, statsData] = await Promise.all([
        api.getReclamaciones({ estado: tab !== 'todos' ? tab : undefined, motivo: motivo || undefined, q: q || undefined }),
        api.getStats()
      ]);
      setCasos(casosData.reclamaciones);
      setStats(statsData);
    } catch(e) { toast(e.message); }
    finally { setLoading(false); }
  }

  function handleCreated(rec) {
    setShowNuevo(false);
    loadAll();
    setSelectedId(rec.id);
  }

  function handleUpdated(rec) {
    setCasos(prev => prev.map(c => c.id === rec.id ? { ...c, ...rec } : c));
    loadAll();
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="topbar">
          <div style={{ fontSize: 15, fontWeight: 600 }}>Bandeja de casos</div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => setShowNuevo(true)}>
              <IconPlus/> Nueva reclamación
            </button>
          </div>
        </div>
        <div className="content">
          {/* Stats */}
          <div className="stats-row">
            {[
              { k: 'abierto', label: 'Abiertos', dot: '#378ADD' },
              { k: 'revision', label: 'En revisión', dot: '#EF9F27' },
              { k: 'proveedor', label: 'Pend. proveedor', dot: '#7F77DD' },
              { k: 'resuelto', label: 'Resueltos', dot: '#1D9E75' },
            ].map(s => (
              <div key={s.k} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setTab(s.k)}>
                <div className="stat-num">{stats[s.k] ?? '—'}</div>
                <div className="stat-label"><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.dot, marginRight: 4 }}/>{s.label}</div>
              </div>
            ))}
            <div className="stat-card">
              <div className="stat-num">{stats.tiempo_promedio_horas != null ? stats.tiempo_promedio_horas + 'h' : '—'}</div>
              <div className="stat-label">Tiempo promedio</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {TABS.map(t => (
              <button key={t.k} className={`tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>{t.label}</button>
            ))}
          </div>

          {/* Filters */}
          <div className="filters">
            <button className={`filter-chip ${!motivo ? 'active' : ''}`} onClick={() => setMotivo('')}>Todos los motivos</button>
            {MOTIVOS.map(m => (
              <button key={m} className={`filter-chip ${motivo === m ? 'active' : ''}`} onClick={() => setMotivo(motivo === m ? '' : m)}>{m}</button>
            ))}
            <div className="search-box">
              <IconSearch/>
              <input placeholder="Buscar por orden, titular…" value={q} onChange={e => setQ(e.target.value)}/>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N° Reclamación</th>
                  <th>Orden</th>
                  <th>Titular</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Reembolso</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Cargando…</td></tr>
                ) : casos.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No hay casos que coincidan</td></tr>
                ) : casos.map(c => (
                  <tr key={c.id} className={selectedId === c.id ? 'selected' : ''} onClick={() => setSelectedId(c.id)}>
                    <td className="td-order">{c.numero}</td>
                    <td className="td-order" style={{ fontSize: 11 }}>{c.orden}</td>
                    <td className="td-name">{c.titular}</td>
                    <td><span className="motivo-chip">{c.motivo}</span></td>
                    <td><StatusBadge estado={c.estado}/></td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.medio_reembolso || '—'}</td>
                    <td style={{ color: 'var(--text3)' }}>{c.fecha_solicitud}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedId && (
        <DetailPanel
          reclamacionId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
          proveedores={proveedores}
        />
      )}

      {showNuevo && <NuevaReclamacion onClose={() => setShowNuevo(false)} onCreated={handleCreated}/>}
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                  farmatodo/frontend/src/AuthContext.jsx                                                              0000644 0000000 0000000 00000001415 15217032141 017127  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_user')); } catch { return null; }
  });

  function login(token, userData) {
    localStorage.setItem('ft_token', token);
    localStorage.setItem('ft_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
                                                                                                                                                                                                                                                   farmatodo/frontend/src/api.js                                                                       0000644 0000000 0000000 00000003356 15217006735 015262  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const BASE = '/api';

function getToken() {
  return localStorage.getItem('ft_token');
}

async function request(method, path, body, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401) {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_user');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),

  getStats: () => request('GET', '/reclamaciones/stats'),
  getReclamaciones: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v)).toString();
    return request('GET', `/reclamaciones${qs ? '?' + qs : ''}`);
  },
  getReclamacion: (id) => request('GET', `/reclamaciones/${id}`),
  crearReclamacion: (data) => request('POST', '/reclamaciones', data),
  cambiarEstado: (id, estado, proveedor_id) => request('PATCH', `/reclamaciones/${id}/estado`, { estado, proveedor_id }),
  agregarComentario: (id, texto) => request('POST', `/reclamaciones/${id}/comentarios`, { texto }),
  subirEvidencias: (id, formData) => request('POST', `/reclamaciones/${id}/evidencias`, formData, true),

  getUsuarios: (rol) => request('GET', `/usuarios${rol ? '?rol=' + rol : ''}`),
  crearUsuario: (data) => request('POST', '/usuarios', data),
};
                                                                                                                                                                                                                                                                                  farmatodo/frontend/src/main.jsx                                                                     0000644 0000000 0000000 00000001027 15217032141 015604  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import Login from './Login';
import App from './App';

function Root() {
  const { user } = useAuth();
  return user ? <App/> : <Login/>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <Root/>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         farmatodo/frontend/src/Login.jsx                                                                    0000644 0000000 0000000 00000005245 15217032141 015736  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3a3 3 0 110 6 3 3 0 010-6zm6 13H6v-.5c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Farmatodo</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Gestión de reclamaciones</div>
          </div>
        </div>
        <div className="login-title">Iniciar sesión</div>
        <div className="login-sub">Acceso para agentes SAC y proveedores</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required/>
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div style={{ marginTop: 20, padding: 14, background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text3)' }}>
          <strong style={{ display: 'block', marginBottom: 6, color: 'var(--text2)' }}>Cuentas de prueba:</strong>
          Agente SAC: magudelo@farmatodo.com / farmatodo123<br/>
          Proveedor: bayer@proveedores.farmatodo.com / bayer123
        </div>
      </div>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                           farmatodo/frontend/src/DetailPanel.jsx                                                              0000644 0000000 0000000 00000023033 15217032141 017043  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { StatusBadge, ActorTag, IconClose, IconFile, IconImg, IconUpload } from './components';

const ESTADOS = [
  { k: 'abierto', label: 'Abierto' },
  { k: 'revision', label: 'En revisión' },
  { k: 'proveedor', label: 'Pend. proveedor' },
  { k: 'resuelto', label: 'Resuelto' },
  { k: 'cerrado', label: 'Cerrado' },
];

const ESTADO_COLORS = {
  abierto: '#378ADD', revision: '#EF9F27', proveedor: '#7F77DD', resuelto: '#1D9E75', cerrado: '#888780'
};

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function isImage(mime) { return mime?.startsWith('image/'); }

export default function DetailPanel({ reclamacionId, onClose, onUpdated, proveedores }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [assignProv, setAssignProv] = useState('');
  const fileRef = useRef();

  useEffect(() => { load(); }, [reclamacionId]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getReclamacion(reclamacionId);
      setRec(data);
    } catch(e) { toast(e.message); }
    finally { setLoading(false); }
  }

  async function cambiarEstado(estado) {
    try {
      const updated = await api.cambiarEstado(rec.id, estado, estado === 'proveedor' ? assignProv || undefined : undefined);
      setRec(updated);
      onUpdated(updated);
      toast(`Estado actualizado a "${ESTADOS.find(e=>e.k===estado)?.label}"`);
    } catch(e) { toast(e.message); }
  }

  async function enviarComentario() {
    if (!comentario.trim()) return;
    setSavingComment(true);
    try {
      await api.agregarComentario(rec.id, comentario);
      setComentario('');
      await load();
      toast('Comentario agregado');
    } catch(e) { toast(e.message); }
    finally { setSavingComment(false); }
  }

  async function subirArchivos(files) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('archivos', f));
    try {
      await api.subirEvidencias(rec.id, fd);
      await load();
      toast(`${files.length} archivo(s) subido(s)`);
    } catch(e) { toast(e.message); }
  }

  if (loading) return (
    <div className="panel">
      <div className="loader">Cargando caso…</div>
    </div>
  );
  if (!rec) return null;

  const isAgente = user.rol === 'agente_sac';

  return (
    <div className="panel">
      <div className="panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className="panel-order">{rec.numero} · {rec.orden}</div>
            <div className="panel-title">{rec.motivo}</div>
            <div className="panel-meta">
              <StatusBadge estado={rec.estado}/>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{rec.titular} · {rec.fecha_solicitud}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ marginLeft: 12 }}><IconClose/></button>
        </div>
      </div>

      <div className="panel-body">

        {/* Información */}
        <div className="panel-section">
          <div className="panel-section-title">Información del caso</div>
          <div className="info-grid">
            <div className="info-item"><label>Titular</label><span>{rec.titular}</span></div>
            <div className="info-item"><label>Fecha solicitud</label><span>{rec.fecha_solicitud}</span></div>
            <div className="info-item">
              <label>Número de guía</label>
              <span className="mono">{rec.guia || <span style={{ color: 'var(--text3)', fontFamily: 'inherit' }}>Sin guía</span>}</span>
            </div>
            <div className="info-item">
              <label>Medio de reembolso</label>
              {rec.medio_reembolso
                ? <span className="reembolso-badge">{rec.medio_reembolso}</span>
                : <span style={{ color: 'var(--text3)', fontSize: 13 }}>No aplica</span>}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Descripción</label>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{rec.descripcion}</p>
          </div>
        </div>

        {/* Cambiar estado - solo agentes */}
        {isAgente && (
          <div className="panel-section">
            <div className="panel-section-title">Cambiar estado</div>
            {rec.estado !== 'proveedor' && (
              <div className="estado-selector">
                {ESTADOS.map(e => (
                  <button key={e.k} className={`estado-btn ${rec.estado === e.k ? 'sel-' + e.k : ''}`}
                    onClick={() => e.k !== rec.estado && e.k !== 'proveedor' && cambiarEstado(e.k)}>
                    {e.label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                Escalar a proveedor
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="form-control" style={{ flex: 1 }} value={assignProv} onChange={e => setAssignProv(e.target.value)}>
                  <option value="">Seleccionar proveedor…</option>
                  {(proveedores || []).map(p => <option key={p.id} value={p.id}>{p.proveedor_nombre || p.nombre}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={() => assignProv && cambiarEstado('proveedor')}>
                  Escalar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evidencias */}
        <div className="panel-section">
          <div className="panel-section-title">Evidencias ({rec.evidencias?.length || 0})</div>
          <div className="ev-grid">
            {(rec.evidencias || []).map(e => (
              <div key={e.id} className="ev-item" title={`${e.nombre_original} · ${formatSize(e.tamano)}`}>
                <div className="ev-icon" style={{ background: isImage(e.tipo_mime) ? 'var(--blue-light)' : 'var(--red-light)' }}>
                  {isImage(e.tipo_mime)
                    ? <IconImg style={{ color: 'var(--blue)' }}/>
                    : <IconFile style={{ color: 'var(--red)' }}/>}
                </div>
                <div className="ev-name">{e.nombre_original}</div>
                <div className="ev-by">{e.usuario_nombre}</div>
              </div>
            ))}
            <div className="ev-item ev-upload" onClick={() => fileRef.current?.click()} style={{ justifyContent: 'center' }}>
              <IconUpload/>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Agregar</span>
            </div>
          </div>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
            onChange={e => subirArchivos(e.target.files)}/>
        </div>

        {/* Timeline */}
        <div className="panel-section">
          <div className="panel-section-title">Historial</div>
          <div className="timeline">
            {(rec.historial || []).map((h, i) => (
              <div key={i} className="tl-item">
                <div className="tl-dot" style={{ background: ESTADO_COLORS[rec.estado] || '#888' }}/>
                <div className="tl-date">{new Date(h.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</div>
                <div className="tl-text">
                  {h.descripcion}
                  {h.usuario_rol && <ActorTag rol={h.usuario_rol}/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comentarios */}
        <div className="panel-section">
          <div className="panel-section-title">Comentarios</div>
          {(rec.comentarios || []).map((c, i) => (
            <div key={i} className={`comment-card ${c.usuario_rol === 'proveedor' ? 'prov' : ''}`}>
              <div className="comment-header">
                <span className="comment-author">{c.usuario_nombre}</span>
                <ActorTag rol={c.usuario_rol}/>
                <span className="comment-date">
                  {new Date(c.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div className="comment-text">{c.texto}</div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <textarea className="form-control" rows="2" placeholder="Agregar comentario…"
              value={comentario} onChange={e => setComentario(e.target.value)}
              style={{ resize: 'none' }}/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={enviarComentario} disabled={savingComment || !comentario.trim()}>
                {savingComment ? 'Enviando…' : 'Comentar'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     farmatodo/frontend/src/Proveedores.jsx                                                              0000644 0000000 0000000 00000012120 15217032141 017151  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   import { useState, useEffect } from 'react';
import { api } from './api';
import { useToast } from './ToastContext';

export default function Proveedores() {
  const toast = useToast();
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', proveedor_nombre: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const d = await api.getUsuarios('proveedor');
      setProveedores(d.usuarios);
    } catch(e) { toast(e.message); }
  }

  async function crear() {
    if (!form.nombre || !form.email || !form.password) { toast('Completa todos los campos'); return; }
    setSaving(true);
    try {
      await api.crearUsuario({ ...form, rol: 'proveedor' });
      setForm({ nombre: '', email: '', password: '', proveedor_nombre: '' });
      setShowForm(false);
      load();
      toast('Proveedor creado');
    } catch(e) { toast(e.message); }
    finally { setSaving(false); }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
      <div className="topbar">
        <div style={{ fontSize: 15, fontWeight: 600 }}>Proveedores</div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            + Agregar proveedor
          </button>
        </div>
      </div>
      <div className="content">
        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Nuevo proveedor</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre de contacto <span className="required">*</span></label>
                <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Rodríguez"/>
              </div>
              <div className="form-group">
                <label className="form-label">Empresa / Proveedor</label>
                <input className="form-control" value={form.proveedor_nombre} onChange={e => set('proveedor_nombre', e.target.value)} placeholder="Laboratorios XYZ"/>
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico <span className="required">*</span></label>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="proveedor@empresa.com"/>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña inicial <span className="required">*</span></label>
                <input className="form-control" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear} disabled={saving}>{saving ? 'Creando…' : 'Crear proveedor'}</button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Desde</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0
                ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No hay proveedores registrados</td></tr>
                : proveedores.map(p => (
                  <tr key={p.id}>
                    <td className="td-name">{p.proveedor_nombre || '—'}</td>
                    <td>{p.nombre}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{p.email}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: p.activo ? 'var(--green-light)' : 'var(--gray-light)',
                        color: p.activo ? 'var(--green)' : 'var(--gray)'
                      }}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                      {new Date(p.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                farmatodo/frontend/index.html                                                                       0000644 0000000 0000000 00000001077 15217006616 015355  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reclamaciones — Farmatodo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                 farmatodo/frontend/package-lock.json                                                                0000644 0000000 0000000 00000073703 15217006436 016601  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   {
  "name": "frontend",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "frontend",
      "version": "1.0.0",
      "license": "ISC",
      "dependencies": {
        "@vitejs/plugin-react": "^6.0.3",
        "react": "^19.2.7",
        "react-dom": "^19.2.7",
        "react-router-dom": "^7.18.0",
        "vite": "^8.1.0"
      }
    },
    "node_modules/@emnapi/core": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.11.1.tgz",
      "integrity": "sha512-RSvbQmHzdKzNsLYa/wHrbc3KN4sYLKAdPZxqiM2HATqv/SBk2/ENSHpvXGaLOMcsAyz0poEGqkmmKYG3OWiJEQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/wasi-threads": "1.2.2",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.1.tgz",
      "integrity": "sha512-vgj7R3y3Wgx24IQaGPA/R6YFXLHVMOZ0uVEyIQPaWs+rd1AzfEMXlAC22FYwO1XkKR6NPsq7mUandH8oIRdZFw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/wasi-threads": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.2.tgz",
      "integrity": "sha512-c95qOXkHdydNKhscBTebqEC1CVAZpyqOfVfBzQ1qgzyl3gfeldUjIggDbIZgDKsHLgnsM+igH7TJ/eAasaVuMA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@napi-rs/wasm-runtime": {
      "version": "1.1.6",
      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-1.1.6.tgz",
      "integrity": "sha512-ZLv/JdUfkvOy9eCnnBaGfiO+XimbjebAeO+MRQqD/B+FR1tnRN0tpKSJHRbE8sFfS6aqsXZ67TQjfwfsxULVbg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@tybys/wasm-util": "^0.10.3"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      },
      "peerDependencies": {
        "@emnapi/core": "^1.7.1",
        "@emnapi/runtime": "^1.7.1"
      }
    },
    "node_modules/@oxc-project/types": {
      "version": "0.137.0",
      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.137.0.tgz",
      "integrity": "sha512-WT+Gb24i8hmvo85AIv2oEYouEXkRlKAlT9WaCa3TfLgNCN+GhrJOGZuIlMouAh38Qe4QOx26eUOVsq70qXrywA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/Boshen"
      }
    },
    "node_modules/@rolldown/binding-android-arm64": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm64/-/binding-android-arm64-1.1.3.tgz",
      "integrity": "sha512-DT6Z3PhvioeHMvxo+xHc3KtqggrI7CCTXCmC2h/5zUlp5jVitv7XEy+9q5/7v8IolhlioawpMo8Kg0EEBy7J0g==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-arm64": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-arm64/-/binding-darwin-arm64-1.1.3.tgz",
      "integrity": "sha512-0NwgwsjM7LrsuVnXMK3koTpagBNOhloc/BNjKqZjv4V5zI5r13qx69uVhRx+o5Z0yy4Hzq+lpy7TAgUG/ocvrw==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-x64": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-x64/-/binding-darwin-x64-1.1.3.tgz",
      "integrity": "sha512-YtiBp4disu6V560loT6PjMdiRaWmVvDNrUunAalbiFx2ggeJwxdAsgZMcoGP17uyAsTwAj5V1niksxlHnVQ1Sw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-freebsd-x64": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-freebsd-x64/-/binding-freebsd-x64-1.1.3.tgz",
      "integrity": "sha512-yD3EkEdXk2LypPxnf/kSZHirarsI8gcPzc62SukhR9VJTyvV+F9Q/GxWNuCojc7sXyuVC4DxRGhdDK4X8VSsbw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm-gnueabihf": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.1.3.tgz",
      "integrity": "sha512-c+8vieQbsD7HNAHKIA34w0GJ9FedFFuJGD+7E6vz7Q3uqAIugL5p45fhlsj4UaAsHpcmlqugBWMhA0/j7o0sIg==",
      "cpu": [
        "arm"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-gnu": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.1.3.tgz",
      "integrity": "sha512-50jD0uUwLvur7Zz9LHz17kaAdTPjn5wN93hEgjvmYFRZwiR7ZJYovTd5ipyWJDAnXKvZ+wgc+/Ika6dwSF5OcA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-musl": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.1.3.tgz",
      "integrity": "sha512-BO9+oPL8K9poZJBfYPsXNtYjPE5uM3qeehT3aFcW4LITOl+iSqhp0abzjR2nWBUNjIZeKXjAEWBZ64WjNoHd6w==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-ppc64-gnu": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.1.3.tgz",
      "integrity": "sha512-f3VpLB1vQ0Eo6ecr/6cekLnvYMFF4YBFoVGkfkvPLq1bAkbAwHYQPZKoAmG6OJyTcxxoC+AvezGx/S1obNC0Mw==",
      "cpu": [
        "ppc64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-s390x-gnu": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.1.3.tgz",
      "integrity": "sha512-AmurZ26Pqx/RI9N1gzEOCklkKXl927yjfXWUUS0O7Puh8ARM/Ob8qfrD3qnWksScdw6cSrW5PSHE9DyLu7+PtA==",
      "cpu": [
        "s390x"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-gnu": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.1.3.tgz",
      "integrity": "sha512-JJpqs8bRGITDOdbkNKnlojzBabbOHrqjSvDr0IVsZObE1lBcPjxItUEY9eWIDbxaJ3cGrXPWGfGkIxFijg/URg==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-musl": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-musl/-/binding-linux-x64-musl-1.1.3.tgz",
      "integrity": "sha512-rSJcdjPxzA/by/6/rYs+v+bXU7UjvnbUWz8MJb6kh6+knqB1dCrtHg0uu7C/4haqJvqdkYHQ5IGn+tCH9GLW/g==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-openharmony-arm64": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-openharmony-arm64/-/binding-openharmony-arm64-1.1.3.tgz",
      "integrity": "sha512-hQ3/PYkDJICgevvyNcVrihVeqq7k1Pp3VZ9lY+dauAYUJKO+auqApvANhvR1An9BhmqYKvW2Mu1F9u4DXSMLxQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-wasm32-wasi": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-wasm32-wasi/-/binding-wasm32-wasi-1.1.3.tgz",
      "integrity": "sha512-Elcv/BtML9lXrV6JuKITc/grN2kYV9gjsQpW8Jfw4ioK0TOkjBjye0nnyqQNy9STNaI20lXNaQBRrD5gSgR0Yg==",
      "cpu": [
        "wasm32"
      ],
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "1.11.1",
        "@emnapi/runtime": "1.11.1",
        "@napi-rs/wasm-runtime": "^1.1.6"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-arm64-msvc": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.1.3.tgz",
      "integrity": "sha512-2DrEfhluH9yhiaFApmsjsjwrSYbNcY1oFTzYSP1a535jDbV98zCFanA/96TBUd0iDFcxGmw9QRExwGCXz3U+/g==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-x64-msvc": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.1.3.tgz",
      "integrity": "sha512-OL4OMk7UPXOeVGGd3qo5zJyPIljf4AFgk5QAkPPS+OoLuOOozhuaQGC18MxVTnw/06q93gShAJzlwnSCY9YtqA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.1.tgz",
      "integrity": "sha512-2j9bGt5Jh8hj+vPtgzPtl72j0yRxHAyumoo6TNfAjsLB04UtpSvPbPcDcBMxz7n+9CYB0c1GxQFxYRg2jimqGw==",
      "license": "MIT"
    },
    "node_modules/@tybys/wasm-util": {
      "version": "0.10.3",
      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.3.tgz",
      "integrity": "sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@vitejs/plugin-react": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-6.0.3.tgz",
      "integrity": "sha512-vmFvco5/QuC2f9Oj+wTk0+9XeDFkHxSamwZKYc7MxYwKICfvUvlMhqKI0VuICPltGqh1neqBKDvO4kes1ya8vg==",
      "license": "MIT",
      "dependencies": {
        "@rolldown/pluginutils": "^1.0.1"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "peerDependencies": {
        "@rolldown/plugin-babel": "^0.1.7 || ^0.2.0",
        "babel-plugin-react-compiler": "^1.0.0",
        "vite": "^8.0.0"
      },
      "peerDependenciesMeta": {
        "@rolldown/plugin-babel": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        }
      }
    },
    "node_modules/cookie": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/lightningcss": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.32.0.tgz",
      "integrity": "sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==",
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.32.0",
        "lightningcss-darwin-arm64": "1.32.0",
        "lightningcss-darwin-x64": "1.32.0",
        "lightningcss-freebsd-x64": "1.32.0",
        "lightningcss-linux-arm-gnueabihf": "1.32.0",
        "lightningcss-linux-arm64-gnu": "1.32.0",
        "lightningcss-linux-arm64-musl": "1.32.0",
        "lightningcss-linux-x64-gnu": "1.32.0",
        "lightningcss-linux-x64-musl": "1.32.0",
        "lightningcss-win32-arm64-msvc": "1.32.0",
        "lightningcss-win32-x64-msvc": "1.32.0"
      }
    },
    "node_modules/lightningcss-android-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.32.0.tgz",
      "integrity": "sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.32.0.tgz",
      "integrity": "sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.32.0.tgz",
      "integrity": "sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.32.0.tgz",
      "integrity": "sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.32.0.tgz",
      "integrity": "sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==",
      "cpu": [
        "arm"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.32.0.tgz",
      "integrity": "sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.32.0.tgz",
      "integrity": "sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.32.0.tgz",
      "integrity": "sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.32.0.tgz",
      "integrity": "sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.32.0.tgz",
      "integrity": "sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.32.0.tgz",
      "integrity": "sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/nanoid": {
      "version": "3.3.15",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.15.tgz",
      "integrity": "sha512-y7Wygv/7mEOvxTuEQDB8StXdMRBWf1kR/tlhAzBRUFkB2jfcLOAxO/SHmOO2zgz1pVgK29/kyupn059/bCHdjA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
      "integrity": "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.15",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.15.tgz",
      "integrity": "sha512-FfR8sjd4em2T6fb3I2MwAJU7HWVMr9zba+enmQeeWFfCbm+UOC/0X4DS8XtpUTMwWMGbjKYP7xjfNekzyGmB3A==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.12",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/react": {
      "version": "19.2.7",
      "resolved": "https://registry.npmjs.org/react/-/react-19.2.7.tgz",
      "integrity": "sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKtaaV+WlAN36mpT4hcRpwbf3fY56ar2oIXzsBpOAiIRHAdY0OlQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "19.2.7",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.2.7.tgz",
      "integrity": "sha512-t0BRVXvbiE/o20Hfw669rLbMCDWtYZLvmJigy2f0MxsXF+71pxhR3xOkspmsO8h3ZlNzyibAmtCa3l4lYKk6gQ==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.27.0"
      },
      "peerDependencies": {
        "react": "^19.2.7"
      }
    },
    "node_modules/react-router": {
      "version": "7.18.0",
      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.0.tgz",
      "integrity": "sha512-pTTGt8J+ji1NOmYnjzT+bAJy/1zD+Jp4ziO6cL7T3ZLvXKtusO7BpFqlRXitqpcPVqllsIXFHRMt+2/k3Xn6HQ==",
      "license": "MIT",
      "dependencies": {
        "cookie": "^1.0.1",
        "set-cookie-parser": "^2.6.0"
      },
      "engines": {
        "node": ">=20.0.0"
      },
      "peerDependencies": {
        "react": ">=18",
        "react-dom": ">=18"
      },
      "peerDependenciesMeta": {
        "react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/react-router-dom": {
      "version": "7.18.0",
      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.0.tgz",
      "integrity": "sha512-Fi0yY6kgtKae/Th2xibdWK0KSdYZ4B53Gyf6wRtomOKWgpNm7H7+DyfDhncdz9FKbpS+1jmDhg3F4WoGJ+yFOA==",
      "license": "MIT",
      "dependencies": {
        "react-router": "7.18.0"
      },
      "engines": {
        "node": ">=20.0.0"
      },
      "peerDependencies": {
        "react": ">=18",
        "react-dom": ">=18"
      }
    },
    "node_modules/rolldown": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/rolldown/-/rolldown-1.1.3.tgz",
      "integrity": "sha512-1F1eEtUBtFvcGm1HQ9TiUIUHPQG7mSAODrhIzjxoUEFuo8OcbrGLiVLkevNgj84TE4lnHvnumwFjhJO5Eu135g==",
      "license": "MIT",
      "dependencies": {
        "@oxc-project/types": "=0.137.0",
        "@rolldown/pluginutils": "^1.0.0"
      },
      "bin": {
        "rolldown": "bin/cli.mjs"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "optionalDependencies": {
        "@rolldown/binding-android-arm64": "1.1.3",
        "@rolldown/binding-darwin-arm64": "1.1.3",
        "@rolldown/binding-darwin-x64": "1.1.3",
        "@rolldown/binding-freebsd-x64": "1.1.3",
        "@rolldown/binding-linux-arm-gnueabihf": "1.1.3",
        "@rolldown/binding-linux-arm64-gnu": "1.1.3",
        "@rolldown/binding-linux-arm64-musl": "1.1.3",
        "@rolldown/binding-linux-ppc64-gnu": "1.1.3",
        "@rolldown/binding-linux-s390x-gnu": "1.1.3",
        "@rolldown/binding-linux-x64-gnu": "1.1.3",
        "@rolldown/binding-linux-x64-musl": "1.1.3",
        "@rolldown/binding-openharmony-arm64": "1.1.3",
        "@rolldown/binding-wasm32-wasi": "1.1.3",
        "@rolldown/binding-win32-arm64-msvc": "1.1.3",
        "@rolldown/binding-win32-x64-msvc": "1.1.3"
      }
    },
    "node_modules/scheduler": {
      "version": "0.27.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
      "integrity": "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
      "license": "MIT"
    },
    "node_modules/set-cookie-parser": {
      "version": "2.7.2",
      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
      "license": "MIT"
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD",
      "optional": true
    },
    "node_modules/vite": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/vite/-/vite-8.1.0.tgz",
      "integrity": "sha512-BuJcQK/56NQTWDGn4ABea3q4SSBdNPWwNZKTkkUpcMPnLoquSYH8llRtSUIgoL1KSCpHt5eghLShn50mH36y7Q==",
      "license": "MIT",
      "dependencies": {
        "lightningcss": "^1.32.0",
        "picomatch": "^4.0.4",
        "postcss": "^8.5.15",
        "rolldown": "~1.1.2",
        "tinyglobby": "^0.2.17"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "@vitejs/devtools": "^0.3.0",
        "esbuild": "^0.27.0 || ^0.28.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "@vitejs/devtools": {
          "optional": true
        },
        "esbuild": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    }
  }
}
                                                             farmatodo/frontend/package.json                                                                     0000644 0000000 0000000 00000000556 15217007232 015642  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   {
  "name": "farmatodo-reclamaciones-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.11"
  }
}
                                                                                                                                                  farmatodo/backend/                                                                                  0000755 0000000 0000000 00000000000 15217007267 013126  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/backend/.env                                                                              0000644 0000000 0000000 00000000207 15217007746 013720  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   PORT=3001
JWT_SECRET=cambia_esto_en_produccion_usa_un_string_largo_y_aleatorio
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
                                                                                                                                                                                                                                                                                                                                                                                         farmatodo/backend/src/                                                                              0000755 0000000 0000000 00000000000 15217006575 013716  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/backend/src/db.js                                                                         0000644 0000000 0000000 00000010272 15217043171 014634  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const { Pool } = require('pg');
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
    // Convert ? placeholders to $1, $2... for PostgreSQL
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
                                                                                                                                                                                                                                                                                                                                      farmatodo/backend/src/middleware/                                                                   0000755 0000000 0000000 00000000000 15217006466 016032  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/backend/src/middleware/auth.js                                                            0000644 0000000 0000000 00000001414 15217006466 017331  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'farmatodo_secret_dev_2024';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRol, JWT_SECRET };
                                                                                                                                                                                                                                                    farmatodo/backend/src/server.js                                                                     0000644 0000000 0000000 00000002426 15217027656 015571  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   require('dotenv').config();
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
                                                                                                                                                                                                                                          farmatodo/backend/src/routes/                                                                       0000755 0000000 0000000 00000000000 15217006566 015237  5                                                                                                    ustar   root                            root                                                                                                                                                                                                                   farmatodo/backend/src/routes/usuarios.js                                                            0000644 0000000 0000000 00000004156 15217027751 017454  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authMiddleware, requireRol } = require('../middleware/auth');

router.get('/', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { rol } = req.query;
    let sql = 'SELECT id,nombre,email,rol,proveedor_nombre,activo,created_at FROM usuarios WHERE activo=1';
    const params = [];
    if (rol) { sql += ' AND rol=?'; params.push(rol); }
    res.json({ usuarios: await db.all(sql, params) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { nombre, email, password, rol, proveedor_nombre } = req.body;
    if (!nombre||!email||!password||!rol) return res.status(400).json({ error: 'Campos requeridos: nombre, email, password, rol' });
    if (!['agente_sac','proveedor'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    const exists = await db.get('SELECT id FROM usuarios WHERE email=?', [email]);
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });
    const id = uuidv4();
    await db.run(`INSERT INTO usuarios (id,nombre,email,password_hash,rol,proveedor_nombre) VALUES (?,?,?,?,?,?)`,
      [id, nombre, email, bcrypt.hashSync(password,10), rol, proveedor_nombre||null]);
    res.status(201).json({ id, nombre, email, rol, proveedor_nombre });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', authMiddleware, requireRol('agente_sac'), async (req, res) => {
  try {
    const { nombre, activo } = req.body;
    if (nombre !== undefined) await db.run('UPDATE usuarios SET nombre=? WHERE id=?', [nombre, req.params.id]);
    if (activo !== undefined) await db.run('UPDATE usuarios SET activo=? WHERE id=?', [activo?1:0, req.params.id]);
    res.json(await db.get('SELECT id,nombre,email,rol,proveedor_nombre,activo FROM usuarios WHERE id=?', [req.params.id]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
                                                                                                                                                                                                                                                                                                                                                                                                                  farmatodo/backend/src/routes/evidencias.js                                                          0000644 0000000 0000000 00000003721 15217027740 017707  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const router = require('express').Router({ mergeParams: true });
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
                                               farmatodo/backend/src/routes/reclamaciones.js                                                       0000644 0000000 0000000 00000017357 15217027726 020420  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const router = require('express').Router();
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
                                                                                                                                                                                                                                                                                 farmatodo/backend/src/routes/auth.js                                                                0000644 0000000 0000000 00000002210 15217027664 016533  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const user = await db.get('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, proveedor_nombre: user.proveedor_nombre },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, proveedor_nombre: user.proveedor_nombre } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

module.exports = router;
                                                                                                                                                                                                                                                                                                                                                                                        farmatodo/backend/package-lock.json                                                                 0000644 0000000 0000000 00000156306 15217006413 016345  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   {
  "name": "backend",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "backend",
      "version": "1.0.0",
      "license": "ISC",
      "dependencies": {
        "bcryptjs": "^3.0.3",
        "better-sqlite3": "^12.11.1",
        "cors": "^2.8.6",
        "dotenv": "^17.4.2",
        "express": "^5.2.1",
        "jsonwebtoken": "^9.0.3",
        "multer": "^2.2.0",
        "uuid": "^14.0.1"
      }
    },
    "node_modules/accepts": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-2.0.0.tgz",
      "integrity": "sha512-5cvg6CtKwfgdmVqY1WIiXKc3Q1bkRqGLi+2W/6ao+6Y7gu/RCwRuAhGEzh5B4KlszSuTLgZYuqFqo5bImjNKng==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "^3.0.0",
        "negotiator": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/append-field": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/append-field/-/append-field-1.0.0.tgz",
      "integrity": "sha512-klpgFSWLW1ZEs8svjfb7g4qWY0YS5imI82dTg+QahUvJ8YqAY0P10Uk8tTyh9ZGuYEZEMaeJYCF5BFuX552hsw==",
      "license": "MIT"
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/bcryptjs": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/bcryptjs/-/bcryptjs-3.0.3.tgz",
      "integrity": "sha512-GlF5wPWnSa/X5LKM1o0wz0suXIINz1iHRLvTS+sLyi7XPbe5ycmYI3DlZqVGZZtDgl4DmasFg7gOB3JYbphV5g==",
      "license": "BSD-3-Clause",
      "bin": {
        "bcrypt": "bin/bcrypt"
      }
    },
    "node_modules/better-sqlite3": {
      "version": "12.11.1",
      "resolved": "https://registry.npmjs.org/better-sqlite3/-/better-sqlite3-12.11.1.tgz",
      "integrity": "sha512-dq9AtApgg5PGFtBzPFSBl3HZQjHok5gaQCM6zh2Yk0aSmDCs1CbnVI8/HgASQkNKsWFpseIO9beg5xxpYhbIfA==",
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "bindings": "^1.5.0",
        "prebuild-install": "^7.1.1"
      },
      "engines": {
        "node": "20.x || 22.x || 23.x || 24.x || 25.x || 26.x"
      }
    },
    "node_modules/bindings": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/bindings/-/bindings-1.5.0.tgz",
      "integrity": "sha512-p2q/t/mhvuOj/UeLlV6566GD/guowlr0hHxClI0W9m7MWYkL1F0hLo+0Aexs9HSPCtR1SXQ0TD3MMKrXZajbiQ==",
      "license": "MIT",
      "dependencies": {
        "file-uri-to-path": "1.0.0"
      }
    },
    "node_modules/bl": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/bl/-/bl-4.1.0.tgz",
      "integrity": "sha512-1W07cM9gS6DcLperZfFSj+bWLtaPGSOHWhPiGzXmvVJbRLdG82sH/Kn8EtW1VqWVA54AKf2h5k5BbnIbwF3h6w==",
      "license": "MIT",
      "dependencies": {
        "buffer": "^5.5.0",
        "inherits": "^2.0.4",
        "readable-stream": "^3.4.0"
      }
    },
    "node_modules/body-parser": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-2.3.0.tgz",
      "integrity": "sha512-2cGmJupaNgg+QUwVLAucDuWuoMZ6EX9iHDRswZ5lsNYEmwPaRknMPCLZz07yTzVq/83p4o/wzbDZbBrTvGGTIw==",
      "license": "MIT",
      "dependencies": {
        "bytes": "^3.1.2",
        "content-type": "^2.0.0",
        "debug": "^4.4.3",
        "http-errors": "^2.0.1",
        "iconv-lite": "^0.7.2",
        "on-finished": "^2.4.1",
        "qs": "^6.15.2",
        "raw-body": "^3.0.2",
        "type-is": "^2.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/body-parser/node_modules/content-type": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.0.0.tgz",
      "integrity": "sha512-j/O/d7GcZCyNl7/hwZAb606rzqkyvaDctLmckbxLzHvFBzTJHuGEdodATcP3yIRoDrLHkIATJuvzbFlp/ki2cQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/buffer": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-5.7.1.tgz",
      "integrity": "sha512-EHcyIPBQ4BSGlvjB16k5KgAJ27CIsHY/2JBmCRReo48y9rQ3MaUzWX3KVlBa4U7MyX02HdVj0K7C3WaB3ju7FQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.1.13"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "license": "MIT"
    },
    "node_modules/busboy": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/busboy/-/busboy-1.6.0.tgz",
      "integrity": "sha512-8SFQbg/0hQ9xy3UNTB0YEnsNBbWfhf7RtnzpL7TkBiTBRfrQ9Fxcnz7VJsleJpyp6rVLvXiuORqjlHi5q+PYuA==",
      "dependencies": {
        "streamsearch": "^1.1.0"
      },
      "engines": {
        "node": ">=10.16.0"
      }
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/chownr": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/chownr/-/chownr-1.1.4.tgz",
      "integrity": "sha512-jJ0bqzaylmJtVnNgzTeSOs8DPavpbYgEr/b0YL8/2GO3xJEhInFmhKMUnEJQjZumK7KXGFhUy89PrsJWlakBVg==",
      "license": "ISC"
    },
    "node_modules/concat-stream": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/concat-stream/-/concat-stream-2.0.0.tgz",
      "integrity": "sha512-MWufYdFw53ccGjCA+Ol7XJYpAlW6/prSMzuPOTRnJGcGzuhLn4Scrz7qf6o8bROZ514ltazcIFJZevcfbo0x7A==",
      "engines": [
        "node >= 6.0"
      ],
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^3.0.2",
        "typedarray": "^0.0.6"
      }
    },
    "node_modules/content-disposition": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-1.1.0.tgz",
      "integrity": "sha512-5jRCH9Z/+DRP7rkvY83B+yGIGX96OYdJmzngqnw2SBSxqCFPd0w2km3s5iawpGX8krnwSGmF0FW5Nhr0Hfai3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.2.2.tgz",
      "integrity": "sha512-D76uU73ulSXrD1UXF4KE2TMxVVwhsnCgfAyTg9k8P6KGZjlXKrOLe4dJQKI3Bxi5wjesZoFXJWElNWBjPZMbhg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.6.0"
      }
    },
    "node_modules/cors": {
      "version": "2.8.6",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.6.tgz",
      "integrity": "sha512-tJtZBBHA6vjIAaF6EnIaq6laBBP9aq/Y3ouVJjEfoHbRBcHBAHYcMh/w8LDrk2PvIMMq8gmopa5D4V8RmbrxGw==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decompress-response": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/decompress-response/-/decompress-response-6.0.0.tgz",
      "integrity": "sha512-aW35yZM6Bb/4oJlZncMH2LCoZtJXTRxES17vE3hoRiowU2kWHaJKFkSBDnDR+cm9J+9QhXmREyIfv0pji9ejCQ==",
      "license": "MIT",
      "dependencies": {
        "mimic-response": "^3.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/deep-extend": {
      "version": "0.6.0",
      "resolved": "https://registry.npmjs.org/deep-extend/-/deep-extend-0.6.0.tgz",
      "integrity": "sha512-LOHxIOaPYdHlJRtCQfDIVZtfw/ufM8+rVj649RIHzcm/vGwQRXFt6OPqIFWsm2XEMrNIEtWR64sY1LEKD2vAOA==",
      "license": "MIT",
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/dotenv": {
      "version": "17.4.2",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-17.4.2.tgz",
      "integrity": "sha512-nI4U3TottKAcAD9LLud4Cb7b2QztQMUEfHbvhTH09bqXTxnSie8WnjPALV/WMCrJZ6UV/qHJ6L03OqO3LcdYZw==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/end-of-stream": {
      "version": "1.4.5",
      "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.5.tgz",
      "integrity": "sha512-ooEGc6HP26xXq/N+GCGOT0JKCLDGrq2bQUZrQ7gyrJiZANJ/8YDTxTpQBXGMn+WbIQXNVpyWymm7KYVICQnyOg==",
      "license": "MIT",
      "dependencies": {
        "once": "^1.4.0"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/expand-template": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/expand-template/-/expand-template-2.0.3.tgz",
      "integrity": "sha512-XYfuKMvj4O35f/pOXLObndIRvyQ+/+6AhODh+OKWj9S9498pHHn/IMszH+gt0fBCRWMNfk1ZSp5x3AifmnI2vg==",
      "license": "(MIT OR WTFPL)",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/express": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/express/-/express-5.2.1.tgz",
      "integrity": "sha512-hIS4idWWai69NezIdRt2xFVofaF4j+6INOpJlVOLDO8zXGpUVEVzIYk12UUi2JzjEzWL3IOAxcTubgz9Po0yXw==",
      "license": "MIT",
      "dependencies": {
        "accepts": "^2.0.0",
        "body-parser": "^2.2.1",
        "content-disposition": "^1.0.0",
        "content-type": "^1.0.5",
        "cookie": "^0.7.1",
        "cookie-signature": "^1.2.1",
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "finalhandler": "^2.1.0",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "merge-descriptors": "^2.0.0",
        "mime-types": "^3.0.0",
        "on-finished": "^2.4.1",
        "once": "^1.4.0",
        "parseurl": "^1.3.3",
        "proxy-addr": "^2.0.7",
        "qs": "^6.14.0",
        "range-parser": "^1.2.1",
        "router": "^2.2.0",
        "send": "^1.1.0",
        "serve-static": "^2.2.0",
        "statuses": "^2.0.1",
        "type-is": "^2.0.1",
        "vary": "^1.1.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/file-uri-to-path": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/file-uri-to-path/-/file-uri-to-path-1.0.0.tgz",
      "integrity": "sha512-0Zt+s3L7Vf1biwWZ29aARiVYLx7iMGnEUl9x33fbB/j3jR81u/O2LbqK+Bm1CDSNDKVtJ/YjwY7TUd5SkeLQLw==",
      "license": "MIT"
    },
    "node_modules/finalhandler": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-2.1.1.tgz",
      "integrity": "sha512-S8KoZgRZN+a5rNwqTxlZZePjT/4cnm0ROV70LedRHZ0p8u9fRID0hJUZQpkKLzro8LfmC8sx23bY6tVNxv8pQA==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "on-finished": "^2.4.1",
        "parseurl": "^1.3.3",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-2.0.0.tgz",
      "integrity": "sha512-Rx/WycZ60HOaqLKAi6cHRKKI7zxWbJ31MhntmtwMoaTeF7XFH9hhBp8vITaMidfljRQ6eYWCKkaTK+ykVJHP2A==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/fs-constants": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs-constants/-/fs-constants-1.0.0.tgz",
      "integrity": "sha512-y6OAwoSIf7FyjMIv94u+b5rdheZEjzR63GTyZJm5qh4Bi+2YgwLCcI/fPFZkL5PSixOt6ZNKm+w+Hfp/Bciwow==",
      "license": "MIT"
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/github-from-package": {
      "version": "0.0.0",
      "resolved": "https://registry.npmjs.org/github-from-package/-/github-from-package-0.0.0.tgz",
      "integrity": "sha512-SyHy3T1v2NUXn29OsWdxmK6RwHD+vkj3v8en8AOBZ1wBQ/hCAQ5bAQTD02kW4W9tUp/3Qh6J8r9EvntiyCmOOw==",
      "license": "MIT"
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.2.tgz",
      "integrity": "sha512-im9DjEDQ55s9fL4EYzOAv0yMqmMBSZp6G0VvFyTMPKWxiSBHUj9NW/qqLmXUwXrrM7AvqSlTCfvqRb0cM8yYqw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/ieee754": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
      "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ini": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/ini/-/ini-1.3.8.tgz",
      "integrity": "sha512-JV/yugV2uzW5iMRSiZAyDtQd+nxtUnjeLt0acNdw98kKLrvuRVyB80tsREOE7yvGVgalhZ6RNXCmEHkUKBKxew==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-promise": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/is-promise/-/is-promise-4.0.0.tgz",
      "integrity": "sha512-hvpoI6korhJMnej285dSg6nu1+e6uxs7zG3BYAm5byqDsgJNWwxzM6z6iZiAgQR4TJ30JmBTOwqZUw3WlyH3AQ==",
      "license": "MIT"
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",
      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",
      "license": "MIT",
      "dependencies": {
        "jws": "^4.0.1",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",
      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-1.1.0.tgz",
      "integrity": "sha512-aisnrDP4GNe06UcKFnV5bfMNPBUw4jsLGaWwWfnH3v02GnBuXX2MCVn5RbrWo0j3pczUilYblq7fQ7Nw2t5XKw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/merge-descriptors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-2.0.0.tgz",
      "integrity": "sha512-Snk314V5ayFLhp3fkUREub6WtjBfPdCPY1Ln8/8munuLuiYhsABgBVWsozAG+MWMbVEvcdcpbi9R7ww22l9Q3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mime-db": {
      "version": "1.54.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.54.0.tgz",
      "integrity": "sha512-aU5EJuIN2WDemCcAp2vFBfp/m4EAhWJnUNSSw0ixs7/kXbd6Pg64EmwJkNdFhB8aWt1sH2CTXrLxo/iAGV3oPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-3.0.2.tgz",
      "integrity": "sha512-Lbgzdk0h4juoQ9fCKXW4by0UJqj+nOOrI9MJ1sSj4nI8aI2eo1qmvQEie4VD1glsS250n15LsWsYtCugiStS5A==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "^1.54.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/mimic-response": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/mimic-response/-/mimic-response-3.1.0.tgz",
      "integrity": "sha512-z0yWI+4FDrrweS8Zmt4Ej5HdJmky15+L2e6Wgn3+iK5fWzb6T3fhNFq2+MeTRb064c6Wr4N/wv0DzQTjNzHNGQ==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/mkdirp-classic": {
      "version": "0.5.3",
      "resolved": "https://registry.npmjs.org/mkdirp-classic/-/mkdirp-classic-0.5.3.tgz",
      "integrity": "sha512-gKLcREMhtuZRwRAfqP3RFW+TK4JqApVBtOIftVgjuABpAtpxhPGaDcfvbhNvD0B8iD1oUr/txX35NjcaY6Ns/A==",
      "license": "MIT"
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/multer": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/multer/-/multer-2.2.0.tgz",
      "integrity": "sha512-6rdyFg2kLrMh9Jee7/BMPuV9lEAd7lLW2YUpF9/YxR7njyoUwwQ0ZPh3TaIY50Sw6vlyD2HW3wGOkTS4P79xrQ==",
      "license": "MIT",
      "dependencies": {
        "append-field": "^1.0.0",
        "busboy": "^1.6.0",
        "concat-stream": "^2.0.0",
        "type-is": "^1.6.18"
      },
      "engines": {
        "node": ">= 10.16.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/multer/node_modules/media-typer": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/type-is": {
      "version": "1.6.18",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
      "integrity": "sha512-TkRKr9sUTxEH8MdfuCSP7VizJyzRNMjj2J2do2Jr3Kym598JVdEksuzPQCnlFPW4ky9Q+iA+ma9BGm06XQBy8g==",
      "license": "MIT",
      "dependencies": {
        "media-typer": "0.3.0",
        "mime-types": "~2.1.24"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/napi-build-utils": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/napi-build-utils/-/napi-build-utils-2.0.0.tgz",
      "integrity": "sha512-GEbrYkbfF7MoNaoh2iGG84Mnf/WZfB0GdGEsM8wz7Expx/LlWf5U8t9nvJKXSp3qr5IsEbK04cBGhol/KwOsWA==",
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-1.0.0.tgz",
      "integrity": "sha512-8Ofs/AUQh8MaEcrlq5xOX0CQ9ypTF5dl78mjlMNfOK08fzpgTHQRQPBxcPlEtIw0yRpws+Zo/3r+5WRby7u3Gg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/node-abi": {
      "version": "3.92.0",
      "resolved": "https://registry.npmjs.org/node-abi/-/node-abi-3.92.0.tgz",
      "integrity": "sha512-KdHvFWZjEKDf0cakgFjebl371GPsISX2oZHcuyKqM7DtogIsHrqKeLTo8wBHxaXRAQlY2PsPlZmfo+9ZCxEREQ==",
      "license": "MIT",
      "dependencies": {
        "semver": "^7.3.5"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "8.4.2",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.4.2.tgz",
      "integrity": "sha512-qRcuIdP69NPm4qbACK+aDogI5CBDMi1jKe0ry5rSQJz8JVLsC7jV8XpiJjGRLLol3N+R5ihGYcrPLTno6pAdBA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/prebuild-install": {
      "version": "7.1.3",
      "resolved": "https://registry.npmjs.org/prebuild-install/-/prebuild-install-7.1.3.tgz",
      "integrity": "sha512-8Mf2cbV7x1cXPUILADGI3wuhfqWvtiLA1iclTDbFRZkgRQS0NqsPZphna9V+HyTEadheuPmjaJMsbzKQFOzLug==",
      "deprecated": "No longer maintained. Please contact the author of the relevant native addon; alternatives are available.",
      "license": "MIT",
      "dependencies": {
        "detect-libc": "^2.0.0",
        "expand-template": "^2.0.3",
        "github-from-package": "0.0.0",
        "minimist": "^1.2.3",
        "mkdirp-classic": "^0.5.3",
        "napi-build-utils": "^2.0.0",
        "node-abi": "^3.3.0",
        "pump": "^3.0.0",
        "rc": "^1.2.7",
        "simple-get": "^4.0.0",
        "tar-fs": "^2.0.0",
        "tunnel-agent": "^0.6.0"
      },
      "bin": {
        "prebuild-install": "bin.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
      "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/pump": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/pump/-/pump-3.0.4.tgz",
      "integrity": "sha512-VS7sjc6KR7e1ukRFhQSY5LM2uBWAUPiOPa/A3mkKmiMwSmRFUITt0xuj+/lesgnCv+dPIEYlkzrcyXgquIHMcA==",
      "license": "MIT",
      "dependencies": {
        "end-of-stream": "^1.1.0",
        "once": "^1.3.1"
      }
    },
    "node_modules/qs": {
      "version": "6.15.2",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.15.2.tgz",
      "integrity": "sha512-Rzq0KEyX/w/tEybncDgdkZrJgVUsUMk3xjh3t5bv3S1HTAtg+uOYt72+ZfwiQwKdysThkTBdL/rTi6HDmX9Ddw==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/raw-body": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-3.0.2.tgz",
      "integrity": "sha512-K5zQjDllxWkf7Z5xJdV0/B0WTNqx6vxG70zJE4N0kBs4LovmEYWJzQGxC9bS9RAKu3bgM40lrd5zoLJ12MQ5BA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.7.0",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/rc": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/rc/-/rc-1.2.8.tgz",
      "integrity": "sha512-y3bGgqKj3QBdxLbLkomlohkvsA8gdAiUQlSBJnBhfn+BPxg4bc62d8TcBW15wavDfgexCgccckhcZvywyQYPOw==",
      "license": "(BSD-2-Clause OR MIT OR Apache-2.0)",
      "dependencies": {
        "deep-extend": "^0.6.0",
        "ini": "~1.3.0",
        "minimist": "^1.2.0",
        "strip-json-comments": "~2.0.1"
      },
      "bin": {
        "rc": "cli.js"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/router": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/router/-/router-2.2.0.tgz",
      "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "is-promise": "^4.0.0",
        "parseurl": "^1.3.3",
        "path-to-regexp": "^8.0.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/send/-/send-1.2.1.tgz",
      "integrity": "sha512-1gnZf7DFcoIcajTjTwjwuDjzuz4PPcY2StKPlsGAQ1+YH20IRVrBaXSWmdjowTJ6u8Rc01PoYOGHXfP1mYcZNQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.3",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.1",
        "mime-types": "^3.0.2",
        "ms": "^2.1.3",
        "on-finished": "^2.4.1",
        "range-parser": "^1.2.1",
        "statuses": "^2.0.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/serve-static": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-2.2.1.tgz",
      "integrity": "sha512-xRXBn0pPqQTVQiC8wyQrKs2MOlX24zQ0POGaj0kultvoOCstBQM5yvOhAVSUwOMjQtTvsPWoNCHfPGwaaQJhTw==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "parseurl": "^1.3.3",
        "send": "^1.2.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/simple-concat": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/simple-concat/-/simple-concat-1.0.1.tgz",
      "integrity": "sha512-cSFtAPtRhljv69IK0hTVZQ+OfE9nePi/rtJmw5UjHeVyVroEqJXP1sFztKUy1qU+xvz3u/sfYJLa947b7nAN2Q==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/simple-get": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/simple-get/-/simple-get-4.0.1.tgz",
      "integrity": "sha512-brv7p5WgH0jmQJr1ZDDfKDOSeWWg+OVypG99A/5vYGPqJ6pxiaHLy8nxtFjBA7oMa01ebA9gfh1uMCFqOuXxvA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "decompress-response": "^6.0.0",
        "once": "^1.3.1",
        "simple-concat": "^1.0.0"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/streamsearch": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/streamsearch/-/streamsearch-1.1.0.tgz",
      "integrity": "sha512-Mcc5wHehp9aXz1ax6bZUyY5afg9u2rv5cqQI3mRrYkGC8rW2hM02jWuwjtL++LS5qinSyhj2QfLyNsuc+VsExg==",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-2.0.1.tgz",
      "integrity": "sha512-4gB8na07fecVVkOI6Rs4e7T6NOTki5EmL7TUduTs6bu3EdnSycntVJ4re8kgZA+wx9IueI2Y11bfbgwtzuE0KQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/tar-fs": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/tar-fs/-/tar-fs-2.1.4.tgz",
      "integrity": "sha512-mDAjwmZdh7LTT6pNleZ05Yt65HC3E+NiQzl672vQG38jIrehtJk/J3mNwIg+vShQPcLF/LV7CMnDW6vjj6sfYQ==",
      "license": "MIT",
      "dependencies": {
        "chownr": "^1.1.1",
        "mkdirp-classic": "^0.5.2",
        "pump": "^3.0.0",
        "tar-stream": "^2.1.4"
      }
    },
    "node_modules/tar-stream": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/tar-stream/-/tar-stream-2.2.0.tgz",
      "integrity": "sha512-ujeqbceABgwMZxEJnk2HDY2DlnUZ+9oEcb1KzTVfYHio0UE6dG71n60d8D2I4qNvleWrrXpmjpt7vZeF1LnMZQ==",
      "license": "MIT",
      "dependencies": {
        "bl": "^4.0.3",
        "end-of-stream": "^1.4.1",
        "fs-constants": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^3.1.1"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/tunnel-agent": {
      "version": "0.6.0",
      "resolved": "https://registry.npmjs.org/tunnel-agent/-/tunnel-agent-0.6.0.tgz",
      "integrity": "sha512-McnNiV1l8RYeY8tBgEpuodCC1mLUdbSN+CYBL7kJsJNInOP8UjDDEwdk6Mw60vdLLrr5NHKZhMAOSrR2NZuQ+w==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/type-is": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-2.1.0.tgz",
      "integrity": "sha512-faYHw0anBbc/kWF3zFTEnxSFOAGUX9GFbOBthvDdLsIlEoWOFOtS0zgCiQYwIskL9iGXZL3kAXD8OoZ4GmMATA==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.0.0",
        "media-typer": "^1.1.0",
        "mime-types": "^3.0.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/type-is/node_modules/content-type": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.0.0.tgz",
      "integrity": "sha512-j/O/d7GcZCyNl7/hwZAb606rzqkyvaDctLmckbxLzHvFBzTJHuGEdodATcP3yIRoDrLHkIATJuvzbFlp/ki2cQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/typedarray": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/typedarray/-/typedarray-0.0.6.tgz",
      "integrity": "sha512-/aCDEGatGvZ2BIk+HmLf4ifCJFwvKFNb9/JeZPMulfgFracn9QFcAf5GO8B/mweUjSoblS5In0cWhqpfs/5PQA==",
      "license": "MIT"
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT"
    },
    "node_modules/uuid": {
      "version": "14.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-14.0.1.tgz",
      "integrity": "sha512-6ZxzVpzDXDa3bJWaHilVayA+BH/1zmxCJoVgvmqJnid/gPoKHxUrS/aC/T6LGQtNHT+XHG9fXPJB4d+IrU30Ew==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist-node/bin/uuid"
      }
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    }
  }
}
                                                                                                                                                                                                                                                                                                                          farmatodo/backend/package.json                                                                      0000644 0000000 0000000 00000000642 15217043176 015415  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   {
  "name": "farmatodo-reclamaciones-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  }
}
                                                                                              farmatodo/backend/.env.example                                                                      0000644 0000000 0000000 00000000207 15217007236 015344  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   PORT=3001
JWT_SECRET=cambia_esto_en_produccion_usa_un_string_largo_y_aleatorio
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
                                                                                                                                                                                                                                                                                                                                                                                         farmatodo/README.md                                                                                 0000644 0000000 0000000 00000011305 15217007264 013013  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   # Plataforma de Reclamaciones — Farmatodo

Módulo independiente para gestión interna de reclamaciones de clientes.

## Estructura del proyecto

```
farmatodo/
├── backend/
│   ├── src/
│   │   ├── db.js                 # SQLite schema + seed
│   │   ├── server.js             # Express entry point
│   │   ├── middleware/auth.js    # JWT middleware
│   │   └── routes/
│   │       ├── auth.js           # Login / me
│   │       ├── reclamaciones.js  # CRUD + estados + comentarios
│   │       ├── evidencias.js     # Upload de archivos
│   │       └── usuarios.js       # Gestión de usuarios
│   ├── data/                     # Base de datos SQLite (auto-generada)
│   ├── uploads/                  # Archivos subidos (auto-generada)
│   └── .env.example
└── frontend/
    └── src/
        ├── main.jsx              # Entry point
        ├── App.jsx               # Shell + sidebar
        ├── Login.jsx             # Pantalla de login
        ├── Bandeja.jsx           # Vista principal agente SAC
        ├── DetailPanel.jsx       # Panel lateral de caso
        ├── NuevaReclamacion.jsx  # Modal de creación
        ├── ProveedorView.jsx     # Portal proveedor
        ├── Proveedores.jsx       # Gestión de proveedores
        ├── api.js                # Cliente HTTP
        ├── AuthContext.jsx       # Contexto de autenticación
        ├── ToastContext.jsx      # Notificaciones UI
        └── components.jsx        # Componentes compartidos
```

## Arranque en desarrollo

### 1. Backend

```bash
cd backend
cp .env.example .env          # Edita JWT_SECRET antes de producción
npm install
npm run dev
# → http://localhost:3001
```

La base de datos SQLite se crea automáticamente en `data/farmatodo.db`
con usuarios seed la primera vez.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

El frontend hace proxy de `/api` al backend en desarrollo (vite.config.js).

## Cuentas iniciales

| Rol        | Email                                  | Contraseña    |
|------------|----------------------------------------|---------------|
| Agente SAC | magudelo@farmatodo.com                 | farmatodo123  |
| Agente SAC | jperez@farmatodo.com                   | farmatodo123  |
| Proveedor  | bayer@proveedores.farmatodo.com        | bayer123      |
| Proveedor  | novartis@proveedores.farmatodo.com     | novartis123   |

## Build para producción

```bash
# 1. Build del frontend
cd frontend && npm run build

# 2. Arrancar backend en modo producción (sirve el frontend también)
cd ../backend
NODE_ENV=production JWT_SECRET=tu_secreto_seguro npm start
# → http://localhost:3001
```

## API endpoints

| Método | Ruta                                      | Auth         | Descripción                    |
|--------|-------------------------------------------|--------------|--------------------------------|
| POST   | /api/auth/login                           | No           | Login, retorna JWT             |
| GET    | /api/auth/me                              | JWT          | Info del usuario actual        |
| GET    | /api/reclamaciones                        | JWT          | Listar (filtros: estado, q)    |
| GET    | /api/reclamaciones/stats                  | SAC          | Estadísticas por estado        |
| GET    | /api/reclamaciones/:id                    | JWT          | Detalle + historial + evidencias |
| POST   | /api/reclamaciones                        | SAC          | Crear reclamación              |
| PATCH  | /api/reclamaciones/:id/estado             | SAC          | Cambiar estado                 |
| POST   | /api/reclamaciones/:id/comentarios        | JWT          | Agregar comentario             |
| POST   | /api/reclamaciones/:id/evidencias         | JWT          | Subir archivos (multipart)     |
| GET    | /api/reclamaciones/:id/evidencias/:eid/download | JWT  | Descargar archivo              |
| GET    | /api/usuarios                             | SAC          | Listar usuarios                |
| POST   | /api/usuarios                             | SAC          | Crear usuario                  |

## Siguiente paso recomendado: migrar a PostgreSQL

Cambiar `better-sqlite3` → `pg` y ajustar las queries en `db.js`.
El resto del código permanece igual.

## Integración con Kustomer (Fase 2)

El proyecto ya tiene el MCP de Kustomer disponible. La integración
consiste en:
1. Al crear una reclamación → crear/buscar conversación en Kustomer
2. Al cambiar estado → agregar nota en la conversación de Kustomer
3. Al cerrar → marcar la conversación como resuelta en Kustomer
                                                                                                                                                                                                                                                                                                                           farmatodo/.gitignore                                                                                0000644 0000000 0000000 00000000422 15217016766 013531  0                                                                                                    ustar   root                            root                                                                                                                                                                                                                   # Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Base de datos y uploads (datos de producción)
backend/data/
backend/uploads/

# Variables de entorno
.env
backend/.env
frontend/.env

# Build del frontend
frontend/dist/

# OS
.DS_Store
Thumbs.db
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              