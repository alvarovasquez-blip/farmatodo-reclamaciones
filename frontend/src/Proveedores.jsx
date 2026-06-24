import { useState, useEffect } from 'react';
import { api } from './api';
import { useToast } from './ToastContext';

export default function Proveedores() {
  const toast = useToast();
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', proveedor_nombre: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const d = await api.getUsuarios('proveedor');
      setProveedores(d.usuarios);
    } catch(e) { toast(e.message); }
  }

  async function crear() {
    if (!form.nombre || !form.email || !form.password) { toast('Completa todos los campos'); return; }
    setSaving(true);
    try {
      await api.crearUsuario({ ...form, rol: 'proveedor' });
      setForm({ nombre: '', email: '', password: '', proveedor_nombre: '' });
      setShowForm(false);
      load();
      toast('Proveedor creado');
    } catch(e) { toast(e.message); }
    finally { setSaving(false); }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
      <div className="topbar">
        <div style={{ fontSize: 15, fontWeight: 600 }}>Proveedores</div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            + Agregar proveedor
          </button>
        </div>
      </div>
      <div className="content">
        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Nuevo proveedor</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre de contacto <span className="required">*</span></label>
                <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Rodríguez"/>
              </div>
              <div className="form-group">
                <label className="form-label">Empresa / Proveedor</label>
                <input className="form-control" value={form.proveedor_nombre} onChange={e => set('proveedor_nombre', e.target.value)} placeholder="Laboratorios XYZ"/>
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico <span className="required">*</span></label>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="proveedor@empresa.com"/>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña inicial <span className="required">*</span></label>
                <input className="form-control" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 8 caracteres"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear} disabled={saving}>{saving ? 'Creando…' : 'Crear proveedor'}</button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Desde</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0
                ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No hay proveedores registrados</td></tr>
                : proveedores.map(p => (
                  <tr key={p.id}>
                    <td className="td-name">{p.proveedor_nombre || '—'}</td>
                    <td>{p.nombre}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{p.email}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: p.activo ? 'var(--green-light)' : 'var(--gray-light)',
                        color: p.activo ? 'var(--green)' : 'var(--gray)'
                      }}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                      {new Date(p.created_at).toLocaleDateString('es-CO')}
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
