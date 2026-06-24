const BASE = '/api';

function getToken() {
  return localStorage.getItem('ft_token');
}

async function request(method, path, body, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401) {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_user');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),

  getStats: () => request('GET', '/reclamaciones/stats'),
  getReclamaciones: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v)).toString();
    return request('GET', `/reclamaciones${qs ? '?' + qs : ''}`);
  },
  getReclamacion: (id) => request('GET', `/reclamaciones/${id}`),
  crearReclamacion: (data) => request('POST', '/reclamaciones', data),
  cambiarEstado: (id, estado, proveedor_id) => request('PATCH', `/reclamaciones/${id}/estado`, { estado, proveedor_id }),
  agregarComentario: (id, texto) => request('POST', `/reclamaciones/${id}/comentarios`, { texto }),
  subirEvidencias: (id, formData) => request('POST', `/reclamaciones/${id}/evidencias`, formData, true),

  getUsuarios: (rol) => request('GET', `/usuarios${rol ? '?rol=' + rol : ''}`),
  crearUsuario: (data) => request('POST', '/usuarios', data),
};
