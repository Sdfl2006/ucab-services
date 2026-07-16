import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Usuario mock por defecto para facilitar las pruebas durante la evaluación
const MOCK_DEFAULT_USER = {
  id: 'usr-001',
  cedula: 'V-31229670',
  nombres: 'Jimena',
  apellidos: 'Martínez',
  nombreCompleto: 'Jimena Martínez',
  correo: 'hola@sitioincreible.com',
  telefono: '0414-1234567',
  direccion: 'Av. Teherán, Montalbán II, Caracas',
  sede: 'Montalbán',
  rol: 'Estudiante', // Estudiante, Profesor, Egresado, Personal Administrativo, Becario, Preparador, Aliado Externo
  categoriaFidelidad: 'Frecuente',
  estadoCuenta: 'activa',
  ultimaConexion: new Date().toISOString(),
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, verificamos si hay sesión guardada
  useEffect(() => {
    const storedUser = localStorage.getItem('ucab_user_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error al parsear la sesión:', error);
        localStorage.removeItem('ucab_user_session');
      }
    }
    setLoading(false);
  }, []);

  // Función para Iniciar Sesión (Login HU-04)
  const login = async (correo, clave) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulación de autenticación (acepta el correo mock o crea una sesión dinámica con el correo ingresado)
        if (correo && clave) {
          const sessionUser = {
            ...MOCK_DEFAULT_USER,
            correo: correo,
            nombreCompleto: correo.includes('hola') ? 'Jimena Martínez' : correo.split('@')[0],
            nombres: correo.includes('hola') ? 'Jimena' : correo.split('@')[0],
            ultimaConexion: new Date().toISOString(),
          };
          setUser(sessionUser);
          localStorage.setItem('ucab_user_session', JSON.stringify(sessionUser));
          setLoading(false);
          resolve(sessionUser);
        } else {
          setLoading(false);
          reject(new Error('Credenciales inválidas. Por favor verifique correo y contraseña.'));
        }
      }, 800); // Simulamos latencia de red
    });
  };

  // Función para Registro de Nuevos Miembros (HU-01)
  const register = async (userData) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: `usr-${Date.now()}`,
          cedula: userData.cedula,
          nombres: userData.nombres,
          apellidos: userData.apellidos,
          nombreCompleto: `${userData.nombres} ${userData.apellidos}`,
          correo: userData.correo,
          telefono: userData.telefono || 'No registrado',
          direccion: userData.direccion || 'Caracas, Venezuela',
          sede: userData.sede || 'Montalbán',
          rol: userData.rol || 'Estudiante',
          categoriaFidelidad: 'Regular',
          estadoCuenta: 'activa',
          ultimaConexion: new Date().toISOString(),
        };
        setUser(newUser);
        localStorage.setItem('ucab_user_session', JSON.stringify(newUser));
        setLoading(false);
        resolve(newUser);
      }, 1000);
    });
  };

  // Función para Cerrar Sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ucab_user_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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