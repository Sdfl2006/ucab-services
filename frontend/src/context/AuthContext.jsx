import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import { onSessionInvalidated } from '../services/api';

const AuthContext = createContext();

const MENSAJES_SESION = {
  sesion_requerida: 'Debes iniciar sesión para continuar.',
  sesion_expirada: 'Tu sesión expiró. Inicia sesión de nuevo.',
};

// El JWT real (ver authController.js) trae: cedula, correo, nombres,
// apellidos, roles (array), categoria_fidelidad. Varias pantallas ya
// existentes leen `user.rol` (singular) y `user.nombreCompleto`, que NO
// vienen del backend — se derivan aquí para no tener que tocar todos los
// componentes que ya asumían esa forma.
function normalizeUser(payload) {
  if (!payload) return null;
  return {
    ...payload,
    roles: payload.roles || [],
    rol: payload.roles?.[0] || 'Miembro',
    nombreCompleto: `${payload.nombres || ''} ${payload.apellidos || ''}`.trim(),
    categoriaFidelidad: payload.categoria_fidelidad,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState(null);

  useEffect(() => {
    setUser(normalizeUser(authService.getUserFromToken()));
    setLoading(false);
  }, []);

  useEffect(() => {
    return onSessionInvalidated((reason) => {
      if (reason === 'sin_permiso') return; // problema de rol puntual, no de sesión
      authService.logout();
      setUser(null);
      setSessionNotice(MENSAJES_SESION[reason] || null);
    });
  }, []);

  // Firma (correo, clave) intacta: Login.jsx no necesita cambios, el
  // uuid_dispositivo que exige el backend se genera solo en authService.
  const login = useCallback(async (correo, password) => {
    setLoading(true);
    try {
      const rawUser = await authService.login(correo, password);
      const normalized = normalizeUser(rawUser);
      setUser(normalized);
      setSessionNotice(null);
      return normalized;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // El backend NO autologuea al registrar (la cuenta queda en cuarentena
  // hasta que Personal_Administrativo la active), así que esto solo crea
  // el registro y devuelve el mensaje del servidor. No toca `user`.
  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      return await userService.registrar(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasRole = useCallback((rol) => user?.roles?.includes(rol) ?? false, [user]);
  const hasAnyRole = useCallback(
    (...roles) => roles.some((r) => user?.roles?.includes(r)),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        sessionNotice,
        clearSessionNotice: () => setSessionNotice(null),
        login,
        logout,
        register,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};