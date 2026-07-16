import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-ucab-light">
        <svg className="w-12 h-12 text-ucab-green animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-semibold text-ucab-blue animate-pulse">
          Verificando credenciales institucionales...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirige al login guardando la ubicación intentada para regresar luego del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}