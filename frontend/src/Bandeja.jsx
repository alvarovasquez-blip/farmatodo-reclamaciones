import { useState, useEffect } from 'react';
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
