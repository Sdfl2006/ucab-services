import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_ESPACIOS, MOCK_DIRECTORIO_MEDICO, TASA_BCV } from '../services/mockData';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function ServiceRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estados del formulario transaccional
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || 'Deportes');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [sede, setSede] = useState(user?.sede || 'Montalbán');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [observaciones, setObservaciones] = useState('');

  // Gestión de Acompañantes (Entidad Acompañante ERE)
  const [incluyeAcompanantes, setIncluyeAcompanantes] = useState(false);
  const [listaAcompanantes, setListaAcompanantes] = useState([]);
  const [nuevoAcompanante, setNuevoAcompanante] = useState({ nombre: '', cedula: '' });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones de servicio dinámicas según la categoría elegida
  const getOpcionesServicio = () => {
    switch (categoria) {
      case 'Deportes':
      case 'Cultura y Eventos':
      case 'alquiler':
        return MOCK_ESPACIOS.map(e => ({ id: e.id, nombre: `${e.nombre} (${e.sede})`, precioUsd: e.tarifaHoraUsd, sede: e.sede }));
      case 'Servicios Médicos':
      case 'medico':
        return MOCK_DIRECTORIO_MEDICO.map(m => ({ id: m.id, nombre: `Consulta: ${m.nombre} (${m.especialidad})`, precioUsd: m.costoUsd, sede: m.sede }));
      case 'Trámites Académicos':
      case 'academico':
        return [
          { id: 'acad-1', nombre: 'Emisión de Constancia de Estudios Certificada', precioUsd: 10, sede: 'Ambas' },
          { id: 'acad-2', nombre: 'Solicitud de Solvencia Administrativa y Biblioteca', precioUsd: 5, sede: 'Ambas' },
          { id: 'acad-3', nombre: 'Certificación de Notas para el Exterior', precioUsd: 30, sede: 'Ambas' },
        ];
      case 'Carnetización':
      case 'carnet':
        return [
          { id: 'carn-1', nombre: 'Emisión de Carnet / Tarjeta Académica Inteligente (TAI)', precioUsd: 12, sede: 'Ambas' },
          { id: 'carn-2', nombre: 'Reposición por Extravío o Deterioro TAI', precioUsd: 15, sede: 'Ambas' },
        ];
      default:
        return [{ id: 'gen-1', nombre: 'Servicio Institucional General', precioUsd: 20, sede: 'Ambas' }];
    }
  };

  const opcionesActuales = getOpcionesServicio();

  // Seleccionar automáticamente el primer servicio de la lista al cambiar categoría
  useEffect(() => {
    if (opcionesActuales.length > 0 && !servicioSeleccionado) {
      setServicioSeleccionado(opcionesActuales[0].nombre);
    }
  }, [categoria]);

  // Cálculo de Precio en USD y Bs (HU-08)
  const itemSeleccionado = opcionesActuales.find(o => o.nombre === servicioSeleccionado) || { precioUsd: 20 };
  const montoTotalUsd = itemSeleccionado.precioUsd;
  const montoTotalBs = montoTotalUsd * TASA_BCV;

  // Añadir un acompañante a la lista
  const handleAddAcompanante = (e) => {
    e.preventDefault();
    if (!nuevoAcompanante.nombre || !nuevoAcompanante.cedula) return;
    setListaAcompanantes([...listaAcompanantes, nuevoAcompanante]);
    setNuevoAcompanante({ nombre: '', cedula: '' });
  };

  // Quitar acompañante
  const handleRemoveAcompanante = (index) => {
    setListaAcompanantes(listaAcompanantes.filter((_, i) => i !== index));
  };

  // Procesar solicitud transaccional
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fecha) {
      setError('Por favor seleccione una fecha programada para el servicio.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Creamos el objeto de la solicitud para pasarlo al Checkout (HU-08 / HU-09)
      const nuevaSolicitud = {
        id: `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        nroSolicitud: `${Math.floor(1000 + Math.random() * 9000)}`,
        servicio: servicioSeleccionado,
        categoria: categoria,
        sede: sede,
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaEjecucion: `${fecha} ${hora}`,
        estatusGeneral: 'Pendiente',
        montoUsd: montoTotalUsd,
        montoBs: montoTotalBs,
        acompanantes: listaAcompanantes,
        observaciones: observaciones,
        solicitante: user,
      };

      // Guardamos temporalmente en localStorage para que la pantalla de Pago / Checkout lo reciba
      localStorage.setItem('ucab_pending_order', JSON.stringify(nuevaSolicitud));
      setIsSubmitting(false);

      // Redirigimos a la pantalla de Resumen del Pedido y Pago (HU-08)
      navigate('/checkout');
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Cabecera del Wizard / Formulario */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-ucab-green">Solicitar Servicio o Trámite</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete los datos transaccionales para procesar su orden</p>
        </div>
        <span className="text-xs font-bold bg-ucab-green/10 text-ucab-green px-3 py-1.5 rounded-full border border-ucab-green/20">
          Paso 1 de 2: Configuración
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-shake">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECCIÓN 1: Categoría y Sede */}
        <Card title="1. Selección de Categoría y Campus">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CATEGORÍA DEL SERVICIO</label>
              <select
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setServicioSeleccionado(''); }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green font-medium"
              >
                <option value="Deportes">Deportes (Alquiler Canchas)</option>
                <option value="Cultura y Eventos">Cultura y Eventos (Auditorios)</option>
                <option value="Servicios Médicos">Servicios Médicos y Salud</option>
                <option value="Trámites Académicos">Trámites Académicos (Constancias)</option>
                <option value="Carnetización">Carnetización y TAI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SEDE UCAB PARA EJECUCIÓN</label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green font-medium"
              >
                <option value="Montalbán">Sede Montalbán (Caracas)</option>
                <option value="Guayana">Sede Guayana (Puerto Ordaz)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">TRÁMITE O ESPACIO ESPECÍFICO <span className="text-red-500">*</span></label>
            <select
              value={servicioSeleccionado}
              onChange={(e) => setServicioSeleccionado(e.target.value)}
              required
              className="w-full px-3.5 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green font-bold text-gray-800"
            >
              {opcionesActuales.map((opc) => (
                <option key={opc.id} value={opc.nombre}>
                  {opc.nombre} — Tarifa: ${opc.precioUsd} USD
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* SECCIÓN 2: Agenda y Horario */}
        <Card title="2. Programación de Fecha y Hora">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="FECHA REQUERIDA"
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              helperText="Seleccione el día para la cita médica o uso de la instalación."
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">HORA BLOQUE DE INICIO</label>
              <select
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green font-medium"
              >
                <option value="08:00 AM">08:00 AM - 09:30 AM</option>
                <option value="10:00 AM">10:00 AM - 11:30 AM</option>
                <option value="01:00 PM">01:00 PM - 02:30 PM</option>
                <option value="03:00 PM">03:00 PM - 04:30 PM</option>
                <option value="05:00 PM">05:00 PM - 06:30 PM</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Input
              label="OBSERVACIONES O REQUERIMIENTOS ESPECIALES (OPCIONAL)"
              id="obs"
              placeholder="Ej: Necesitamos red de voleibol adicional / Constancia dirigida a Embajada..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </Card>

        {/* SECCIÓN 3: Entidad Acompañantes (Requisito ERE DrawIO) */}
        {(categoria === 'Deportes' || categoria === 'Cultura y Eventos' || categoria === 'alquiler') && (
          <Card
            title="3. Registro de Acompañantes (Control de Acceso Campus)"
            subtitle="Si va a ingresar al campus con compañeros de equipo o invitados, regístrelos aquí para generar el pase de seguridad."
          >
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={incluyeAcompanantes}
                  onChange={(e) => setIncluyeAcompanantes(e.target.checked)}
                  className="rounded text-ucab-green focus:ring-ucab-green w-4 h-4"
                />
                <span>¿Esta solicitud incluye acompañantes o invitados externos?</span>
              </label>

              {incluyeAcompanantes && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-6">
                      <Input
                        label="NOMBRE Y APELLIDO"
                        placeholder="Ej: Nicole Esser"
                        value={nuevoAcompanante.nombre}
                        onChange={(e) => setNuevoAcompanante({ ...nuevoAcompanante, nombre: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        label="CÉDULA DE IDENTIDAD"
                        placeholder="V-31229670"
                        value={nuevoAcompanante.cedula}
                        onChange={(e) => setNuevoAcompanante({ ...nuevoAcompanante, cedula: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddAcompanante}
                        className="w-full font-bold h-10"
                      >
                        + Añadir
                      </Button>
                    </div>
                  </div>

                  {/* Lista dinámica de Acompañantes añadidos */}
                  {listaAcompanantes.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-bold text-gray-700">Acompañantes en la lista ({listaAcompanantes.length}):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {listaAcompanantes.map((acomp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 text-xs">
                            <div>
                              <p className="font-bold text-gray-800">{acomp.nombre}</p>
                              <p className="text-gray-500 font-mono">{acomp.cedula}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAcompanante(idx)}
                              className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">Aún no ha añadido acompañantes a esta solicitud.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* SECCIÓN 4: Resumen Dinámico de Precios y Envío */}
        <div className="bg-gradient-to-r from-ucab-green to-ucab-blue p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Cálculo Estimado de Tarifa</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-black">${montoTotalUsd.toFixed(2)} USD</span>
              <span className="text-sm text-emerald-100 font-medium">~ Bs. {montoTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[11px] text-emerald-200 mt-1">
              Tasa referencial BCV: <b>{TASA_BCV} Bs/$</b>. El pago podrá realizarse por Pago Móvil o Divisas.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')} className="w-1/3 sm:w-auto text-gray-700">
              Cancelar
            </Button>
            <Button type="submit" variant="accent" size="lg" loading={isSubmitting} className="w-2/3 sm:w-auto font-black shadow-lg">
              Continuar al Pedido →
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}