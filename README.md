# UCAB Services

Este repositorio contiene la aplicación UCAB Services con un backend en Node.js/Express y un frontend en React + Vite.

## Estructura del proyecto

- `backend/`: API REST de Express y conexión a PostgreSQL.
- `frontend/`: aplicación web construida con React, Vite y Tailwind.
- `scripts/`: scripts SQL para crear la base de datos, tablas, datos y reportes.

## Requisitos previos

1. Node.js 20+ instalado.
2. npm instalado.
3. PostgreSQL instalado y en ejecución.
4. Git (opcional, si desea clonar el repositorio).

## Paso 1: Configurar la base de datos

1. Crear una base de datos PostgreSQL.

   ```bash
   createdb ucab_services
   ```

2. Ajustar credenciales de base de datos en `backend/.env`.

   ```env
   NODE_ENV=development
   PORT=3000

   JWT_SECRET=ucab_services_secret_key_2026

   DB_USER=<tu_usuario_postgres>
   DB_HOST=localhost
   DB_PASSWORD=<tu_contraseña_postgres>
   DB_DATABASE=ucab_services
   DB_PORT=5432
   ```

3. Ejecutar los scripts SQL para crear la estructura y los datos iniciales.

   Desde la terminal, usando `psql` o tu cliente favorito:

   ```bash
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/01.tablas.sql
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/02.seguridad.sql
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/03.triggers.sql
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/04.indices.sql
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/05.datos.sql
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/06.reportes.sql
   psql -U <tu_usuario_postgres> -d ucab_services -f scripts/07.alteraciones.sql
   ```

   > Si tu instalación de PostgreSQL requiere `sudo` o una conexión distinta, ajusta el comando según sea necesario.

## Paso 2: Instalar dependencias del backend

1. Ir a la carpeta del backend:

   ```bash
   cd backend
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

## Paso 3: Instalar dependencias del frontend

1. Ir a la carpeta del frontend:

   ```bash
   cd ../frontend
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

## Paso 4: Ejecutar la aplicación

### Iniciar el backend

Desde la carpeta `backend`:

```bash
npm run dev
```

Esto iniciará el servidor en `http://localhost:3000` por defecto. El backend verificará la conexión a PostgreSQL antes de arrancar.

### Iniciar el frontend

Desde la carpeta `frontend`:

```bash
npm run dev -- --host 0.0.0.0
```

Esto iniciará el frontend en `http://localhost:5173` (o el puerto que Vite asigne).

## Paso 5: Acceder a la aplicación

- Frontend: `http://localhost:5173`
- Backend API health: `http://localhost:3000/api/v1/health`

## Configuración de variables de entorno adicionales

El backend utiliza las siguientes variables en `backend/.env`:

- `NODE_ENV`: ambiente (`development` / `production`).
- `PORT`: puerto donde corre el servidor backend.
- `JWT_SECRET`: clave para firmar tokens JWT.
- `DB_USER`: usuario de PostgreSQL.
- `DB_HOST`: host de PostgreSQL.
- `DB_PASSWORD`: contraseña de PostgreSQL.
- `DB_DATABASE`: nombre de la base de datos.
- `DB_PORT`: puerto de PostgreSQL.

## Notas importantes

- El frontend está configurado para consumir la API desde `http://localhost:3000/api/v1` mediante `frontend/src/services/api.js`.
- Si el backend se despliega en otra URL o puerto, ajusta `VITE_API_URL` en el frontend o el archivo `api.js`.
- Si necesitas reconstruir la base de datos, vuelve a ejecutar los scripts SQL en orden.

## Comandos útiles

- Backend:
  - `npm run dev`: iniciar backend con `nodemon`.
  - `npm start`: iniciar backend con Node.
- Frontend:
  - `npm run dev`: iniciar frontend con Vite.
  - `npm run build`: generar build de producción.
  - `npm run preview`: previsualizar el build.

## Posibles verificaciones en caso de error

1. Verifica que PostgreSQL esté en ejecución.
2. Asegura que `backend/.env` tiene las credenciales correctas.
3. Verifica que la base de datos `ucab_services` exista y tenga tablas.
4. Revisa la consola del backend para errores de conexión.
5. Revisa la consola del navegador para errores de CORS o rutas.

---

Con estos pasos podrás desplegar y ejecutar la aplicación completa de UCAB Services en local.
