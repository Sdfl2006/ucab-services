import axios from 'axios';

const SESSION_KEY = 'ucab_user_session';

// Instancia base apuntando al backend en Express (Puerto 3000 por defecto)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Peticiones: Busca la sesión actual e inyecta el token
api.interceptors.request.use(
  (config) => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        if (sessionData?.token) {
          config.headers.Authorization = `Bearer ${sessionData.token}`;
        }
      } catch (error) {
        console.error('Error parseando la sesión de localStorage:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: Manejo de tokens expirados o cuentas suspendidas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o no autorizada. Limpiando credenciales...');
      localStorage.removeItem(SESSION_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function onSessionInvalidated(callback) {
  return () => {
    // placeholder: no real event bus implemented yet.
  };
}

export default api;