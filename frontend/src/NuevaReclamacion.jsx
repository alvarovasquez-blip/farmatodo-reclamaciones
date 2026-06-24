import { useState } from 'react';
import { api } from './api';
import { useToast } from './ToastContext';

const MOTIVOS_REEMBOLSO = ['Pedido incompleto', 'Retracto de compra', 'Pedido no llega', 'Calidad de producto'];

export default function NuevaReclamacion({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    orden: '', titular: '', fecha_solicitud: new Date().toISOString().split('T')[0],
    motivo: '', descripcion: '', guia: '', medio_reembolso: '', despachado: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const needsReembolso = MOTIVOS_REEMBOLSO.includes(form.motivo);
  const needsGuia = form.despachado === 'si';

  async function handleSubmit() {
    if (!form.orden.trim() || !form.titular.trim() || !form.motivo || !form.descripcion.trim()) {
      toast('Completa todos los campos obligatorios'); return;
    }
    setLoading(true);
    try {
      const payload = {
        orden: form.orden.trim(), titular: form.titular.trim(),
        fecha_solicitud: form.fecha_solicitud, motivo: form.motivo,
        descripcion: form.descripcion.trim(),
        guia: needsGuia && form.guia ? form.guia.trim() : undefined,
        medio_reembolso: needsReembolso && form.medio_reembolso ? form.medio_reembolso : undefined,
      };
      const rec = await api.crearReclamacion(payload);
      toast('Reclamación creada exitosamente');
      onCreated(rec);
    } catch (err) {
      toast(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Nueva reclamación</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">N° de orden <span className="required">*</span></label>
              <input className="form-control" placeholder="ORD-2024-00891" value={form.orden} onChange={e => set('orden', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de solicitud <span className="required">*</span></label>
              <input className="form-control" type="date" value={form.fecha_solicitud} onChange={e => set('fecha_solicitud', e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Titular del pedido <span className="required">*</span></label>
            <input className="form-control" placeholder="Nombre completo del cliente" value={form.titular} onChange={e => set('titular', e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Motivo de reclamación <span className="required">*</span></label>
            <select className="form-control" value={form.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="">Seleccionar motivo…</option>
              {['Pedido incompleto','Retracto de compra','Pedido no llega','Calidad de producto','Producto equivocado','Otro'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">¿El pedido fue despachado?</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              {['si','no'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="despachado" value={v} checked={form.despachado === v} onChange={() => set('despachado', v)}/> {v === 'si' ? 'Sí' : 'No'}
                </label>
              ))}
            </div>
          </div>

          {needsGuia && (
            <div className="form-group">
              <div className="conditional-block">
                <label className="form-label" style={{ marginBottom: 8 }}>Número de guía de envío</label>
                <input className="form-control" placeholder="TCC-849201847" value={form.guia} onChange={e => set('guia', e.target.value)}/>
              </div>
            </div>
          )}

          {needsReembolso && (
            <div className="form-group">
              <div className="conditional-block">
                <label className="form-label" style={{ marginBottom: 10 }}>Medio de reembolso</label>
                <div className="medio-options">
                  {['Bre-B','Nequi','Cupon Farmatodo'].map(m => (
                    <button key={m} type="button" className={`medio-opt ${form.medio_reembolso === m ? 'selected' : ''}`}
                      onClick={() => set('medio_reembolso', m)}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Descripción <span className="required">*</span></label>
            <textarea className="form-control" rows="3" placeholder="Describe brevemente lo sucedido…"
              value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              style={{ resize: 'none' }}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando…' : 'Crear reclamación'}
          </button>
        </div>
      </div>
    </div>
  );
}
