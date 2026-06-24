# Plataforma de Reclamaciones — Farmatodo

Módulo independiente para gestión interna de reclamaciones de clientes.

## Estructura del proyecto

```
farmatodo/
├── backend/
│   ├── src/
│   │   ├── db.js                 # SQLite schema + seed
│   │   ├── server.js             # Express entry point
│   │   ├── middleware/auth.js    # JWT middleware
│   │   └── routes/
│   │       ├── auth.js           # Login / me
│   │       ├── reclamaciones.js  # CRUD + estados + comentarios
│   │       ├── evidencias.js     # Upload de archivos
│   │       └── usuarios.js       # Gestión de usuarios
│   ├── data/                     # Base de datos SQLite (auto-generada)
│   ├── uploads/                  # Archivos subidos (auto-generada)
│   └── .env.example
└── frontend/
    └── src/
        ├── main.jsx              # Entry point
        ├── App.jsx               # Shell + sidebar
        ├── Login.jsx             # Pantalla de login
        ├── Bandeja.jsx           # Vista principal agente SAC
        ├── DetailPanel.jsx       # Panel lateral de caso
        ├── NuevaReclamacion.jsx  # Modal de creación
        ├── ProveedorView.jsx     # Portal proveedor
        ├── Proveedores.jsx       # Gestión de proveedores
        ├── api.js                # Cliente HTTP
        ├── AuthContext.jsx       # Contexto de autenticación
        ├── ToastContext.jsx      # Notificaciones UI
        └── components.jsx        # Componentes compartidos
```

## Arranque en desarrollo

### 1. Backend

```bash
cd backend
cp .env.example .env          # Edita JWT_SECRET antes de producción
npm install
npm run dev
# → http://localhost:3001
```

La base de datos SQLite se crea automáticamente en `data/farmatodo.db`
con usuarios seed la primera vez.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

El frontend hace proxy de `/api` al backend en desarrollo (vite.config.js).

## Cuentas iniciales

| Rol        | Email                                  | Contraseña    |
|------------|----------------------------------------|---------------|
| Agente SAC | magudelo@farmatodo.com                 | farmatodo123  |
| Agente SAC | jperez@farmatodo.com                   | farmatodo123  |
| Proveedor  | bayer@proveedores.farmatodo.com        | bayer123      |
| Proveedor  | novartis@proveedores.farmatodo.com     | novartis123   |

## Build para producción

```bash
# 1. Build del frontend
cd frontend && npm run build

# 2. Arrancar backend en modo producción (sirve el frontend también)
cd ../backend
NODE_ENV=production JWT_SECRET=tu_secreto_seguro npm start
# → http://localhost:3001
```

## API endpoints

| Método | Ruta                                      | Auth         | Descripción                    |
|--------|-------------------------------------------|--------------|--------------------------------|
| POST   | /api/auth/login                           | No           | Login, retorna JWT             |
| GET    | /api/auth/me                              | JWT          | Info del usuario actual        |
| GET    | /api/reclamaciones                        | JWT          | Listar (filtros: estado, q)    |
| GET    | /api/reclamaciones/stats                  | SAC          | Estadísticas por estado        |
| GET    | /api/reclamaciones/:id                    | JWT          | Detalle + historial + evidencias |
| POST   | /api/reclamaciones                        | SAC          | Crear reclamación              |
| PATCH  | /api/reclamaciones/:id/estado             | SAC          | Cambiar estado                 |
| POST   | /api/reclamaciones/:id/comentarios        | JWT          | Agregar comentario             |
| POST   | /api/reclamaciones/:id/evidencias         | JWT          | Subir archivos (multipart)     |
| GET    | /api/reclamaciones/:id/evidencias/:eid/download | JWT  | Descargar archivo              |
| GET    | /api/usuarios                             | SAC          | Listar usuarios                |
| POST   | /api/usuarios                             | SAC          | Crear usuario                  |

## Siguiente paso recomendado: migrar a PostgreSQL

Cambiar `better-sqlite3` → `pg` y ajustar las queries en `db.js`.
El resto del código permanece igual.

## Integración con Kustomer (Fase 2)

El proyecto ya tiene el MCP de Kustomer disponible. La integración
consiste en:
1. Al crear una reclamación → crear/buscar conversación en Kustomer
2. Al cambiar estado → agregar nota en la conversación de Kustomer
3. Al cerrar → marcar la conversación como resuelta en Kustomer
