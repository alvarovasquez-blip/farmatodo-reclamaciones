import { useState, useEffect } from 'react';

export default function ResetPassword({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else setError('Token inválido o expirado');
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('https://farmatodo-backend.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch(e) {
      setError(e.message);
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

        {done ? (
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Contraseña actualizada ✓</div>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
              Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onSuccess}>
              Ir al login
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Nueva contraseña</div>
            <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
              Ingresa tu nueva contraseña.
            </div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input className="form-control" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres" required/>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar contraseña</label>
                <input className="form-control" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña" required/>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading || !token}
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {loading ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
