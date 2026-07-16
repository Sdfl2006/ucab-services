import React from 'react';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Barra Lateral (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <h1 className="text-xl font-black text-ucab-green">UCAB<span className="text-ucab-yellow">-Services</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-green-50 text-ucab-green rounded-lg font-semibold transition-colors">
             Inicio
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
             Mis citas
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
             Pagos
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
             Soporte
          </a>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        {/* Cabecera */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Hola Santiago,</h2>
            <p className="text-gray-500 mt-1 text-lg">¿Qué servicio deseas solicitar hoy?</p>
          </div>
          <div className="h-12 w-12 bg-ucab-green rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-ucab-yellow">
            S
          </div>
        </header>

        {/* Tarjetas de Servicios (Módulos principales) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Tarjeta 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer hover:border-ucab-green group">
            <div className="h-12 w-12 bg-green-100 text-ucab-green rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               {/* Aquí luego pondremos un ícono de salud */}
               M
            </div>
            <h3 className="text-lg font-bold text-gray-800">Servicios Médicos</h3>
            <p className="text-sm text-gray-500 mt-2">Agendar Cita, Directorio Médico, Exámenes.</p>
          </div>

          {/* Tarjeta 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer hover:border-ucab-green group">
            <div className="h-12 w-12 bg-yellow-100 text-ucab-yellow rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               D
            </div>
            <h3 className="text-lg font-bold text-gray-800">Deportes y Cultura</h3>
            <p className="text-sm text-gray-500 mt-2">Inscripción a equipos, Alquiler de espacios.</p>
          </div>

          {/* Tarjeta 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer hover:border-ucab-green group">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               E
            </div>
            <h3 className="text-lg font-bold text-gray-800">Eventos</h3>
            <p className="text-sm text-gray-500 mt-2">Reservar auditorios y salones especiales.</p>
          </div>

          {/* Tarjeta 4 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer hover:border-ucab-green group">
            <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               T
            </div>
            <h3 className="text-lg font-bold text-gray-800">Trámites Académicos</h3>
            <p className="text-sm text-gray-500 mt-2">Carnetización, Estatus de Solicitudes.</p>
          </div>

          {/* En la sección de tarjetas, puedes hacer esto: */}
        {user.rol === 'estudiante' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Aquí van las tarjetas exclusivas de estudiante */}
           </div>
        )}

        {user.rol === 'administrativo' && (
           <div className="p-8 bg-white rounded-lg shadow">
              {/* Herramientas de gestión administrativa */}
           </div>
        )}

        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          © 2026 Universidad Católica Andrés Bello | Dirección de Servicios
        </footer>
      </main>

    </div>
  );
}

export default Dashboard;