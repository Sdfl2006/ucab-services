import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import requestService from '../services/requestService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ESTATUS_PASO_BADGE = {
  completado: 'success',
  'en progreso': 'info',
  pendiente: 'default',
};

function normalizeEstatusPaso(estatus) {
  return String(estatus || '').trim().toLowerCase();
}

function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-VE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SeguimientoSolicitud() {
  const { nroSolicitud } = useParams();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const esPersonalOperativo = hasAnyRole('Admin', 'Personal_Administrativo');

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [nuevoAcompanante, setNuevoAcompanante] = useState({ cedula_acompanante: '', nombre: '' });
  const [guardandoAcompanante, setGuardandoAcompanante] = useState(false);
  const [completandoPaso, setCompletandoPaso] = useState(false);

  const cargar = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const resultado = await requestService.getSeguimiento(nroSolicitud);
      setData(resultado);
      setStatus('success');
    } catch (err) {
      setError(err.friendlyMessage || 'No se pudo cargar el seguimiento de la solicitud.');
      setStatus('error');
    }
  }, [nroSolicitud]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleAgregarAcompanante(e) {
    e.preventDefault();
    if (!nuevoAcompanante.cedula_acompanante || !nuevoAcompanante.nombre) return;
    setGuardandoAcompanante(true);
    try {
      await requestService.agregarAcompanante(nroSolicitud, nuevoAcompanante);
      setNuevoAcompanante({ cedula_acompanante: '', nombre: '' });
      await cargar();
    } catch (err) {
      setError(err.friendlyMessage || 'No se pudo agregar el acompañante.');
    } finally {
      setGuardandoAcompanante(false);
    }
  }

  async function handleCompletarPaso(nroPaso) {
    setCompletandoPaso(true);
    try {
      await requestService.completarPaso(nroSolicitud, nroPaso);
      await cargar();
    } catch (err) {
      setError(err.friendlyMessage || 'No se pudo completar el paso.');
    } finally {
      setCompletandoPaso(false);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-gray-500 animate-pulse">
        Cargando seguimiento de la solicitud…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <p className="text-red-600 text-sm font-medium">{error}</p>
        <Button variant="primary" onClick={cargar}>Reintentar</Button>
      </div>
    );
  }

  const { solicitud, eficiencia_operativa, acompanantes_vinculados = [], linea_de_tiempo_workflow = [] } = data;
  const pasoAccionable = linea_de_tiempo_workflow.find(
    (paso) => normalizeEstatusPaso(paso.estatus) !== 'completado'
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <button onClick={() => navigate('/solicitudes')} className="text-xs font-semibold text-ucab-blue hover:underline cursor-pointer">
        ← Volver a Historial de Solicitudes
      </button>

      <div className="bg-gradient-to-r from-ucab-green to-ucab-blue p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Solicitud N.º {solicitud.nro_solicitud}</p>
          <h1 className="text-2xl font-black mt-1">{solicitud.codigo_servicio}</h1>
          <p className="text-xs text-emerald-100 mt-1">
            Creada el {formatFecha(solicitud.fecha_creacion)}
            {solicitud.fecha_cierre && ` · Cerrada el ${formatFecha(solicitud.fecha_cierre)}`}
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center shrink-0">
          <span className="text-3xl font-black block">{eficiencia_operativa.tiempo_transcurrido_dias_habiles}</span>
          <span className="text-[11px] text-emerald-100 uppercase tracking-wide">días hábiles transcurridos</span>
          <div className="mt-2 pt-2 border-t border-white/10">
            <Badge label={eficiencia_operativa.estatus_actual} status={eficiencia_operativa.estatus_actual === 'completado' ? 'success' : 'info'} size="sm" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
          ⚠️ {error}
        </div>
      )}

      <Card title="Línea de tiempo del trámite" subtitle={`${eficiencia_operativa.horas_totales_registradas} horas registradas en total`}>
        <ol className="space-y-4">
          {linea_de_tiempo_workflow.map((paso) => {
            const estatusNormalizado = normalizeEstatusPaso(paso.estatus);
            const esPasoAccionable = pasoAccionable?.nro_paso === paso.nro_paso;

            return (
              <li key={paso.nro_paso} className="flex gap-4">
                <div className="flex flex-col items-center pt-1">
                  <span className={`w-3 h-3 rounded-full ${estatusNormalizado === 'completado' ? 'bg-emerald-500' : estatusNormalizado === 'en progreso' ? 'bg-ucab-blue' : 'bg-gray-300'}`} />
                  {paso.nro_paso !== linea_de_tiempo_workflow.length && <span className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm text-gray-800">Paso {paso.nro_paso} · {paso.descripcion}</p>
                    <Badge label={paso.estatus} status={ESTATUS_PASO_BADGE[estatusNormalizado] || 'default'} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Inicio: {formatFecha(paso.fecha_hora_inicio)} · Fin: {formatFecha(paso.fecha_hora_fin)}
                    {paso.cedula_admin && ` · Responsable: ${paso.cedula_admin}`}
                  </p>
                  {esPersonalOperativo && esPasoAccionable && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2 font-semibold"
                      loading={completandoPaso}
                      onClick={() => handleCompletarPaso(paso.nro_paso)}
                    >
                      Marcar paso como completado
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
          {linea_de_tiempo_workflow.length === 0 && (
            <p className="text-sm text-gray-400">Esta solicitud aún no tiene pasos registrados.</p>
          )}
        </ol>
      </Card>

      <Card title="Acompañantes" subtitle="Personas vinculadas a esta solicitud para control de acceso">
        {acompanantes_vinculados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {acompanantes_vinculados.map((a) => (
              <div key={a.cedula_acompanante} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <span className="font-bold text-gray-800">👤 {a.nombre}</span>
                <span className="font-mono text-gray-500">{a.cedula_acompanante}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">No hay acompañantes asociados a esta solicitud.</p>
        )}

        <form onSubmit={handleAgregarAcompanante} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-4 border-t border-gray-100">
          <div className="sm:col-span-5">
            <Input
              label="CÉDULA"
              placeholder="V-30123456"
              value={nuevoAcompanante.cedula_acompanante}
              onChange={(e) => setNuevoAcompanante((p) => ({ ...p, cedula_acompanante: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-5">
            <Input
              label="NOMBRE Y APELLIDO"
              placeholder="Nicole Esser"
              value={nuevoAcompanante.nombre}
              onChange={(e) => setNuevoAcompanante((p) => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" className="w-full font-bold h-10" loading={guardandoAcompanante}>
              + Añadir
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}