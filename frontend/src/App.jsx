import { useState } from 'react';
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
