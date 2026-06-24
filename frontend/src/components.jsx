export function StatusBadge({ estado }) {
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
