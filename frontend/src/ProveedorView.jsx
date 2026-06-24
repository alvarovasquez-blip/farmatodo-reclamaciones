import { useState, useEffect } from 'react';
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
