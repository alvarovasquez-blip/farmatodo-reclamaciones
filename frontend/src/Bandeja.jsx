import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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

const ESTADO_LABELS = {
  abierto: 'Abierto', revision: 'En revisión', proveedor: 'Pendiente proveedor',
  resuelto: 'Resuelto', cerrado: 'Cerrado'
};

function IconDownload() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>;
}

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
  const [exporting, setExporting] = useState(false);

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

  async function exportarExcel() {
    setExporting(true);
    try {
      // Obtener todos los casos sin filtro para el reporte completo
      const todosData = await api.getReclamaciones({});
      const todos = todosData.reclamaciones;

      const wb = XLSX.utils.book_new();

      // HOJA 1: Todas las reclamaciones
      const hoja1 = todos.map(c => ({
        'N° Reclamación': c.numero,
        'N° Orden': c.orden,
        'Titular': c.titular,
        'Motivo': c.motivo,
        'Estado': ESTADO_LABELS[c.estado] || c.estado,
        'Medio de reembolso': c.medio_reembolso || 'No aplica',
        'N° Guía': c.guia || 'Sin guía',
        'Fecha solicitud': c.fecha_solicitud,
        'Agente': c.agente_nombre || '',
      }));
      const ws1 = XLSX.utils.json_to_sheet(hoja1);
      ws1['!cols'] = [
        {wch:18},{wch:16},{wch:25},{wch:22},{wch:20},{wch:18},{wch:16},{wch:14},{wch:20}
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Todas las reclamaciones');

      // HOJA 2: Filtradas (las que se ven actualmente en pantalla)
      if (casos.length !== todos.length) {
        const hoja2 = casos.map(c => ({
          'N° Reclamación': c.numero,
          'N° Orden': c.orden,
          'Titular': c.titular,
          'Motivo': c.motivo,
          'Estado': ESTADO_LABELS[c.estado] || c.estado,
          'Medio de reembolso': c.medio_reembolso || 'No aplica',
          'N° Guía': c.guia || 'Sin guía',
          'Fecha solicitud': c.fecha_solicitud,
          'Agente': c.agente_nombre || '',
        }));
        const ws2 = XLSX.utils.json_to_sheet(hoja2);
        ws2['!cols'] = [{wch:18},{wch:16},{wch:25},{wch:22},{wch:20},{wch:18},{wch:16},{wch:14},{wch:20}];
        XLSX.utils.book_append_sheet(wb, ws2, 'Filtradas');
      }

      // HOJA 3: Estadísticas
      const hoja3 = [
        { 'Métrica': 'Total reclamaciones', 'Valor': stats.total || 0 },
        { 'Métrica': 'Abiertas', 'Valor': stats.abierto || 0 },
        { 'Métrica': 'En revisión', 'Valor': stats.revision || 0 },
        { 'Métrica': 'Pendiente proveedor', 'Valor': stats.proveedor || 0 },
        { 'Métrica': 'Resueltas', 'Valor': stats.resuelto || 0 },
        { 'Métrica': 'Cerradas', 'Valor': stats.cerrado || 0 },
        { 'Métrica': 'Tiempo promedio resolución (horas)', 'Valor': stats.tiempo_promedio_horas || 'N/A' },
        { 'Métrica': 'Fecha del reporte', 'Valor': new Date().toLocaleString('es-CO') },
      ];
      const ws3 = XLSX.utils.json_to_sheet(hoja3);
      ws3['!cols'] = [{wch:35},{wch:20}];
      XLSX.utils.book_append_sheet(wb, ws3, 'Estadísticas');

      // HOJA 4: Detalle del caso seleccionado
      if (selectedId) {
        try {
          const detalle = await api.getReclamacion(selectedId);
          const hoja4 = [
            { 'Campo': 'N° Reclamación', 'Valor': detalle.numero },
            { 'Campo': 'N° Orden', 'Valor': detalle.orden },
            { 'Campo': 'Titular', 'Valor': detalle.titular },
            { 'Campo': 'Motivo', 'Valor': detalle.motivo },
            { 'Campo': 'Estado', 'Valor': ESTADO_LABELS[detalle.estado] || detalle.estado },
            { 'Campo': 'Medio de reembolso', 'Valor': detalle.medio_reembolso || 'No aplica' },
            { 'Campo': 'N° Guía', 'Valor': detalle.guia || 'Sin guía' },
            { 'Campo': 'Fecha solicitud', 'Valor': detalle.fecha_solicitud },
            { 'Campo': 'Descripción', 'Valor': detalle.descripcion },
            { 'Campo': '', 'Valor': '' },
            { 'Campo': 'HISTORIAL', 'Valor': '' },
            ...(detalle.historial || []).map(h => ({
              'Campo': h.created_at,
              'Valor': h.descripcion
            })),
            { 'Campo': '', 'Valor': '' },
            { 'Campo': 'COMENTARIOS', 'Valor': '' },
            ...(detalle.comentarios || []).map(c => ({
              'Campo': `${c.usuario_nombre} (${c.created_at})`,
              'Valor': c.texto
            })),
            { 'Campo': '', 'Valor': '' },
            { 'Campo': 'EVIDENCIAS', 'Valor': '' },
            ...(detalle.evidencias || []).map(e => ({
              'Campo': e.nombre_original,
              'Valor': e.nombre_archivo
            })),
          ];
          const ws4 = XLSX.utils.json_to_sheet(hoja4);
          ws4['!cols'] = [{wch:30},{wch:60}];
          XLSX.utils.book_append_sheet(wb, ws4, 'Detalle caso');
        } catch(e) {}
      }

      // Descargar
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `farmatodo-reclamaciones-${fecha}.xlsx`);
      toast('Reporte descargado exitosamente');
    } catch(e) {
      toast('Error al generar el reporte: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="topbar">
          <div style={{ fontSize: 15, fontWeight: 600 }}>Bandeja de casos</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={exportarExcel} disabled={exporting}>
              <IconDownload/> {exporting ? 'Generando…' : 'Exportar Excel'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowNuevo(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Nueva reclamación
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
