import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          <p className="font-medium text-gray-700">
            U© 2026 Universidad Católica Andrés Bello | Dirección de Servicios
          </p>
          <p className="mt-0.5 text-gray-400">
            Infraestructura integrada para las sedes de Montalbán y Guayana.
          </p>
        </div>
        <div className="flex items-center gap-6 font-semibold">
          <Link to="/terminos" className="hover:text-ucab-green transition-colors">
            Términos y condiciones
          </Link>
          <Link to="/privacidad" className="hover:text-ucab-green transition-colors">
            Políticas de Privacidad
          </Link>
          <Link to="/soporte" className="hover:text-ucab-green transition-colors">
            Mesa de Ayuda TI
          </Link>
        </div>
      </div>
    </footer>
  );
}