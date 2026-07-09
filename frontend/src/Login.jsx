import { useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') ? 'reset' : 'login';
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.token, data.user);
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (view === 'forgot') return <ForgotPassword onBack={() => setView('login')}/>;
  if (view === 'reset') return <ResetPassword onSuccess={() => setView('login')}/>;

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
            <input className="form-control" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" required/>
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-control" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required/>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <button className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
          onClick={() => setView('forgot')}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  );
}
