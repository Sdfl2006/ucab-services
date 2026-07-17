import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import requestService from '../services/requestService';
import serviceService from '../services/serviceService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function ServiceRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categoria, setCategoria] = useState(searchParams.get('categoria') || 'Deporte');  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [sede, setSede] = useState(user?.sede || 'Montalbán');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('10:00');
  const [observaciones, setObservaciones] = useState('');

  const [incluyeAcompanantes, setIncluyeAcompanantes] = useState(false);
  const [listaAcompanantes, setListaAcompanantes] = useState([]);
  const [nuevoAcompanante, setNuevoAcompanante] = useState({ nombre: '', cedula: '' });

  const [servicios, setServicios] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cargarServicios = async () => {
      setStatus('loading');
      try {
        const serviciosData = await serviceService.getAllServices();
        setServicios(serviciosData);
        setStatus('success');
      } catch (err) {
        setError(err.friendlyMessage || 'No se pudieron cargar los servicios disponibles.');
        setStatus('error');
      }
    };

    cargarServicios();
  }, []);

  const opcionesActuales = useMemo(() => {
    return servicios
      .filter((servicio) => 
        servicio.nombre_categoria === categoria && 
        servicio.nombre_sede === sede
      )
      .map((servicio) => ({
        id: servicio.codigo_servicio,
        nombre: servicio.descripcion_detallada || servicio.codigo_servicio,
        precioUsd: Number(servicio.precio_final_sede ?? servicio.precio_base ?? 0),
        sede: servicio.nombre_sede,
        codigo_servicio: servicio.codigo_servicio,
      }));
  }, [servicios, categoria, sede]); 

  useEffect(() => {
    if (opcionesActuales.length > 0) {
          setServicioSeleccionado(opcionesActuales[0].codigo_servicio);
        } else {
          setServicioSeleccionado('');
        }
      }, [opcionesActuales]);

  const servicioSeleccionadoDetalle = opcionesActuales.find((o) => o.codigo_servicio === servicioSeleccionado) || opcionesActuales[0] || { nombre: '', precioUsd: 0, sede };
  const montoTotalUsd = servicioSeleccionadoDetalle.precioUsd || 0;
  const montoTotalBs = montoTotalUsd * 1;

  const handleAddAcompanante = (e) => {
    e.preventDefault();
    if (!nuevoAcompanante.nombre || !nuevoAcompanante.cedula) return;
    setListaAcompanantes([...listaAcompanantes, nuevoAcompanante]);
    setNuevoAcompanante({ nombre: '', cedula: '' });
  };

  const handleRemoveAcompanante = (index) => {
    setListaAcompanantes(listaAcompanantes.filter((_, i) => i !== index));
  };

  // Función auxiliar para saber qué espacio físico enviar a la BD
  // Función auxiliar para saber qué espacio físico enviar a la BD
  const obtenerEspacioPorDefecto = (cat, sedeActual) => {
    if (cat === 'Deporte' && sedeActual === 'Guayana') return 'GUY-DEP-CF1'; 
    if (cat === 'Cultura' && sedeActual === 'Montalbán') return 'MON-CIN-AUD'; 
    if (cat === 'Cultura' && sedeActual === 'Guayana') return 'GUY-AMG-AUD';
    return undefined; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fecha) {
      setError('Por favor seleccione una fecha programada para el servicio.');
      return;
    }
    if (!servicioSeleccionadoDetalle?.codigo_servicio) {
      setError('Debe seleccionar un servicio válido para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const espacioId = obtenerEspacioPorDefecto(categoria, sede);
      
      // Armamos las horas simuladas basadas en tu selector para probar la BD
      let horaInicio = '10:00:00';
      let horaFin = '12:00:00';
      if (hora === '03:00 PM') { horaInicio = '15:00:00'; horaFin = '17:00:00'; }
      if (hora === '05:00 PM') { horaInicio = '17:00:00'; horaFin = '19:00:00'; }

      const createdRequest = await requestService.createRequest({
        codigo_servicio: servicioSeleccionadoDetalle.codigo_servicio,
        nro_identificador_espacio: espacioId, // YA NO DA ERROR DE FOREIGN KEY
        hora_inicio: `${fecha} ${horaInicio}`, // CRUCIAL PARA LA HU-16
        hora_fin: `${fecha} ${horaFin}`,       // CRUCIAL PARA LA HU-16
        acompanantes: listaAcompanantes.map((a) => ({ cedula_acompanante: a.cedula, nombre: a.nombre })),
      });

      const nuevaSolicitud = {
        nroSolicitud: createdRequest.nro_solicitud,
        servicio: servicioSeleccionadoDetalle.nombre,
        categoria,
        sede,
        fechaCreacion: createdRequest.fecha_creacion || new Date().toISOString(),
        fechaEjecucion: `${fecha} ${hora}`,
        estatusGeneral: createdRequest.estatus_general || 'Pendiente',
        montoUsd: montoTotalUsd,
        montoBs: montoTotalBs,
        acompanantes: listaAcompanantes,
        observaciones,
        solicitante: user,
      };

      localStorage.setItem('ucab_pending_order', JSON.stringify(nuevaSolicitud));
      navigate('/checkout');
    } catch (err) {
      // Si el trigger de la base de datos rechaza por solapamiento, el error se mostrará aquí
      setError(err.friendlyMessage || 'No se pudo enviar la solicitud. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-ucab-green">Solicitar Servicio o Trámite</h1>
          <p className="text-xs text-gray-500 mt-0.5">Complete los datos transaccionales para procesar su orden.</p>
        </div>
        <span className="text-xs font-bold bg-ucab-green/10 text-ucab-green px-3 py-1.5 rounded-full border border-ucab-green/20">
          Paso 1 de 2: Configuración
        </span>
      </div>

      {status === 'loading' && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Cargando servicios disponibles...</div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="1. Selección de Categoría y Campus">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CATEGORÍA DEL SERVICIO</label>
              <select
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setServicioSeleccionado(''); }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green font-medium"
              >
                <option value="Deporte">Deportes (Alquiler Canchas)</option>
                <option value="Cultura">Cultura y Eventos (Auditorios)</option>
                <option value="Salud">Servicios Médicos y Salud</option>
                <option value="Educación Continua">Trámites y Educación Continua</option>
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
              {opcionesActuales.length > 0 ? (
                opcionesActuales.map((opc) => (
                  <option key={opc.id} value={opc.codigo_servicio}>
                    {opc.nombre} — Tarifa: ${opc.precioUsd.toFixed(2)} USD • {opc.sede}
                  </option>
                ))
              ) : (
                <option value="">No hay servicios disponibles para esta categoría</option>
              )}
            </select>
          </div>
        </Card>

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

        {(categoria === 'Deporte' || categoria === 'Cultura' || categoria === 'alquiler') && (
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
                    <p className="text-xs text-gray-500">No hay acompañantes registrados aún.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-semibold">Total estimado</p>
            <p>${montoTotalUsd.toFixed(2)} USD • Bs. {montoTotalBs.toLocaleString('es-VE')}</p>
          </div>
          <Button type="submit" loading={isSubmitting} variant="primary" size="lg" className="w-full sm:w-auto">
            Continuar a Pago
          </Button>
        </div>
      </form>
    </div>
  );
}
