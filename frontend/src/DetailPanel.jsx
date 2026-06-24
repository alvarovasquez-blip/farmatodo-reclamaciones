import { useState, useEffect, useRef } from 'react';
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
