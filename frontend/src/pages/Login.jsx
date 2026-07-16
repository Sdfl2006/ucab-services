import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  return (
    /* Contenedor principal con imagen de fondo del campus y un overlay oscuro */
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative bg-[url('https://elucabista.com/wp-content/uploads/2019/10/UCAB-vista-aerea-1-1.jpg')] bg-cover bg-center">
      
      {/* Capa oscura semitransparente para que la tarjeta resalte */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Tarjeta de Login */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-ucab-yellow">
        
        <div className="p-8 sm:p-10">
          {/* Logo y Encabezado */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img 
              src="https://www.ucab.edu.ve/wp-content/uploads/2017/09/logo-ucab.png" 
              alt="Logo UCAB" 
              className="h-14 mb-5 object-contain"
            />
            <h2 className="text-center text-lg font-bold text-gray-800 border-b-2 border-gray-100 pb-4 w-full">
              Registro de Usuario | UCAB-Services
            </h2>
          </div>

          {/* Textos descriptivos (Referencia HU-04) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Accede</h3>
            <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar con tus trámites</p>
          </div>

          {/* Formulario */}
          <form className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Correo Electrónico
              </label>
              <input 
                type="email" 
                placeholder="tu-correo@ucab.edu.ve"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green focus:bg-white transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Contraseña
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green focus:bg-white transition-all text-sm"
                required
              />
            </div>

            {/* Checkbox y Olvido de contraseña */}
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-ucab-green border-gray-300 rounded focus:ring-ucab-green" />
                <span className="ml-2 text-sm text-gray-600">Recuérdame</span>
              </label>
              <a href="#" className="text-sm font-semibold text-ucab-green hover:text-ucab-green-dark transition-colors">
                ¿Olvidaste tu clave?
              </a>
            </div>

            {/* Botón Principal */}
            <button 
              type="button"
              onClick={() => navigate('/Dashboard')}
              className="w-full bg-ucab-green text-white font-bold text-sm py-3 px-4 rounded-lg hover:bg-ucab-green-dark focus:ring-4 focus:ring-green-200 transition-all shadow-md mt-6"
            >
              Acceder
            </button>
          </form>

          {/* Footer de la tarjeta */}
          <p className="mt-8 text-center text-sm text-gray-600">
            ¿No estás registrado?{' '}
            <a href="#" className="font-bold text-ucab-yellow hover:text-yellow-600 transition-colors">
              Crea tu cuenta aquí
            </a>
          </p>
        </div>
        
        {/* Barra decorativa inferior */}
        <div className="h-2 w-full bg-ucab-green"></div>
      </div>
    </div>
  );
}

export default Login;