import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

export default function Navbar() {
  const { user, logout, hasAnyRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Inicio', path: '/dashboard' },
    { name: 'Mis Citas', path: '/mis-citas' },
    { name: 'Pagos', path: '/pagos' },
    { name: 'Bolsa de Trabajo', path: '/bolsa-trabajo' },
    { name: 'Soporte', path: '/soporte' },
    { name: 'Solicitudes', path: '/solicitudes' },
    // Módulos exclusivos de gerencia/operaciones
    ...(hasAnyRole('Admin', 'Personal_Administrativo') ? [
      { name: 'Taquilla', path: '/taquilla' },
      { name: 'Infraestructura', path: '/infraestructura' }
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-ucab-green text-white shadow-md border-b border-ucab-green-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Nombre de la Plataforma */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 focus:outline-none">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <svg className="w-6 h-6 text-ucab-yellow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-lg leading-none">UCAB</span>
                <span className="text-[10px] text-emerald-200 tracking-widest uppercase font-semibold">Services</span>
              </div>
            </Link>

            {/* Indicador de Sede activa */}
            {user?.sede && (
              <div className="hidden sm:flex items-center ml-2 pl-3 border-l border-white/20">
                <Badge 
                  label={`Sede ${user.sede}`} 
                  className="bg-white/10 text-white border-white/20 text-[11px] font-semibold tracking-wide" 
                />
              </div>
            )}
          </div>

          {/* Enlaces de Navegación Secundaria (Referencia Figura 4) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-ucab-green font-bold shadow-sm'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Perfil del Usuario y Saludo (Figura 4: "Hola Jimena") */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 bg-white text-ucab-blue px-4 py-1.5 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 transition-all border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ucab-yellow"
            >
              <span>Hola, {user?.nombres || 'Usuario'}</span>
              <div className="w-6 h-6 rounded-full bg-ucab-green/10 text-ucab-green flex items-center justify-center text-xs">
                {user?.nombres?.[0] || 'U'}
              </div>
            </button>

            {/* Dropdown del Menú de Usuario */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 text-gray-800 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-sm font-bold text-gray-900">{user?.nombreCompleto}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.correo}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-ucab-blue text-white uppercase">
                      {user?.rol || 'Miembro'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {user?.categoriaFidelidad || 'Regular'}
                    </span>
                  </div>
                </div>

                {/* Enlaces móviles visibles en pantallas pequeñas */}
                <div className="md:hidden border-b border-gray-100 py-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="py-1">
                  <Link
                    to="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Ficha Institucional
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}