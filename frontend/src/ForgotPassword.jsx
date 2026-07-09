import { useState } from 'react';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://farmatodo-backend.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
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

        {sent ? (
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Email enviado ✓</div>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>
              Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onBack}>
              Volver al login
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>¿Olvidaste tu contraseña?</div>
            <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input className="form-control" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com" required/>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={onBack}>
              Volver al login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
