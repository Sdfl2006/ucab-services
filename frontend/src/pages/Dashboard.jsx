import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Estructura de Servicios Principales (HU-05 & Mockup Figura 4)
  const serviceCategories = [
    {
      id: 'medicos',
      title: 'Servicios Médicos',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      ),
      description: 'Atención primaria, especialistas y directorio de salud.',
      links: [
        { name: 'Agendar Cita Médica', path: '/solicitudes/nueva?categoria=medico' },
        { name: 'Resultados y Exámenes', path: '/mis-citas' },
        { name: 'Directorio Médico', path: '/directorio-medico' },
      ],
    },
    {
      id: 'deportes',
      title: 'Deportes y Cultura',
      icon: (
        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Reserva de canchas, auditorios y disciplinas deportivas.',
      links: [
        { name: 'Inscripción a Disciplinas', path: '/solicitudes/nueva?categoria=deporte' },
        { name: 'Alquiler de Espacios (Canchas/Auditorios)', path: '/solicitudes/nueva?categoria=alquiler' },
        { name: 'Agenda de Eventos Culturales', path: '/eventos' },
      ],
    },
    {
      id: 'tramites',
      title: 'Trámites Académicos',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      description: 'Gestión de inscripciones, solvencias y constancias.',
      links: [
        { name: 'Estatus de Solicitudes', path: '/solicitudes' },
        { name: 'Solicitud de Título y Constancias', path: '/solicitudes/nueva?categoria=academico' },
        { name: 'Inscripción de Asignaturas', path: '/solicitudes/nueva?categoria=inscripcion' },
      ],
    },
    {
      id: 'carnetizacion',
      title: 'Carnetización y TAI',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
      description: 'Tarjeta Académica Inteligente y acceso en campus.',
      links: [
        { name: 'Solicitud de Carnet (Nuevo/Extravío)', path: '/solicitudes/nueva?categoria=carnet' },
        { name: 'Recarga y Saldo Billetera TAI', path: '/pagos' },
        { name: 'Validación NFC y Accesos', path: '/perfil' },
      ],
    },
  ];

  // Manejo de la barra de búsqueda de servicios
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/solicitudes/nueva?buscar=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner Superior Institucional (Bienvenida personalizada HU-05) */}
      <div className="bg-gradient-to-r from-ucab-green via-ucab-green-light to-ucab-blue rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-ucab-yellow text-ucab-blue font-extrabold text-xs uppercase tracking-wide">
              {user?.rol || 'Miembro UCAB'}
            </span>
            <span className="text-xs text-emerald-100 font-medium">
              Campus {user?.sede || 'Montalbán'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hola, {user?.nombres || 'Bienvenido'} 👋
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 mt-2 font-light">
            Bienvenido al portal de servicios integrados de la Universidad Católica Andrés Bello. ¿Qué trámite o servicio necesitas gestionar hoy?
          </p>

          {/* Barra de Búsqueda de Servicios (Referencia Figura 4) */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center max-w-lg">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="¿Qué servicio deseas solicitar hoy? (Ej: Alquiler cancha, Constancia...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 bg-white text-gray-900 rounded-full text-sm font-medium shadow-md focus:outline-none focus:ring-4 focus:ring-ucab-yellow/50 placeholder-gray-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-ucab-blue hover:bg-ucab-green text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Grid de Accesos Rápidos a Servicios (HU-05) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Catálogo de Servicios Universitarios</h2>
            <p className="text-xs text-gray-500">Seleccione una categoría para iniciar su solicitud transaccional</p>
          </div>
          <Link to="/solicitudes/nueva" className="text-sm font-semibold text-ucab-green hover:underline flex items-center gap-1">
            Ver todos los servicios →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceCategories.map((category) => (
            <Card
              key={category.id}
              className="hover:shadow-md hover:border-ucab-green/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{category.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{category.description}</p>

                <ul className="space-y-2 border-t border-gray-100 pt-3">
                  {category.links.map((link, idx) => (
                    <li key={idx}>
                      <Link
                        to={link.path}
                        className="text-xs font-semibold text-gray-700 hover:text-ucab-green flex items-center justify-between group py-1"
                      >
                        <span>{link.name}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-ucab-green">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-gray-100">
                <Link
                  to="/solicitudes/nueva"
                  className="w-full text-center block text-xs font-bold text-ucab-green bg-ucab-green/5 hover:bg-ucab-green/10 py-2 rounded-lg transition-colors"
                >
                  Explorar categoría
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Widget Resumen: Estado en Tiempo Real (Valor Agregado) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Estatus en Tiempo Real" subtitle="Sus últimas transacciones y solicitudes activas" className="lg:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  #9978
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Alquiler de Cancha de Fútbol</p>
                  <p className="text-xs text-gray-500">Sede Montalbán • 15 de Mayo, 4:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label="Aprobado" status="success" size="sm" />
                <Link to="/pagos" className="text-xs font-bold text-ucab-green hover:underline">Ver factura</Link>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  #9982
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Constancia de Estudios Universitaria</p>
                  <p className="text-xs text-gray-500">Secretaría Académica • Paso 2: Validación</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label="En Progreso" status="warning" size="sm" />
                <Link to="/solicitudes" className="text-xs font-bold text-ucab-green hover:underline">Seguimiento</Link>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Ayuda y Accesos TI" subtitle="Soporte técnico y recursos UCAB">
          <div className="space-y-3 text-xs text-gray-600">
            <p>
              Si presenta inconvenientes para alquilar auditorios o consultar su saldo en divisas/bolívares, contacte a nuestra mesa de ayuda en línea.
            </p>
            <div className="p-3 bg-ucab-green/5 rounded-lg border border-ucab-green/20">
              <p className="font-bold text-ucab-green">Horario de Atención Taquillas:</p>
              <p className="mt-0.5">Lunes a Viernes: 8:00 AM - 5:00 PM</p>
              <p>Montalbán (Edif. Cincuentenario) / Guayana</p>
            </div>
            <Link
              to="/soporte"
              className="inline-block w-full text-center py-2 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-colors mt-2"
            >
              Abrir Ticket de Soporte
            </Link>
          </div>
        </Card>
      </div>

    </div>
  );
}