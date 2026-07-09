import { useState, useEffect } from 'react';
import { api } from './api';
import { useToast } from './ToastContext';

export default function Agentes() {
  const toast = useToast();
  const [agentes, setAgentes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const d = await api.getUsuarios('agente_sac');
      setAgentes(d.usuarios);
    } catch(e) { toast(e.message); }
  }

  async function crear() {
    if (!form.nombre || !form.email || !form.password) { toast('Completa todos los campos'); return; }
    setSaving(true);
    try {
      await api.crearUsuario({ ...form, rol: 'agente_sac' });
      setForm({ nombre: '', email: '', password: '' });
      setShowForm(false);
      load();
      toast('Agente creado exitosamente');
    } catch(e) { toast(e.message); }
    finally { setSaving(false); }
  }

  async function desactivar(id) {
    try {
      await api.actualizarUsuario(id, { activo: false });
      load();
      toast('Agente desactivado');
    } catch(e) { toast(e.message); }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
      <div className="topbar">
        <div style={{ fontSize: 15, fontWeight: 600 }}>Agentes SAC</div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            + Agregar agente
          </button>
        </div>
      </div>
      <div className="content">
        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Nuevo agente SAC</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre completo <span className="required">*</span></label>
                <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre completo"/>
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico <span className="required">*</span></label>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@farmatodo.com"/>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña inicial <span className="required">*</span></label>
                <input className="form-control" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear} disabled={saving}>{saving ? 'Creando…' : 'Crear agente'}</button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {agentes.length === 0
                ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No hay agentes registrados</td></tr>
                : agentes.map(a => (
                  <tr key={a.id}>
                    <td className="td-name">{a.nombre}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{a.email}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: a.activo ? 'var(--green-light)' : 'var(--gray-light)',
                        color: a.activo ? 'var(--green)' : 'var(--gray)'
                      }}>
                        {a.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                      {new Date(a.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      {a.activo && (
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                          onClick={() => desactivar(a.id)}>
                          Desactivar
                        </button>
                      )}
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
