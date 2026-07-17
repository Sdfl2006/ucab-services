import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import requestService from '../services/requestService';
import serviceService from '../services/serviceService';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function MyRequests() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarSolicitudes = async () => {
      setStatus('loading');
      try {
        const [solicitudesData, serviciosData] = await Promise.all([
          requestService.getRequests(),
          serviceService.getAllServices(),
        ]);
        setSolicitudes(solicitudesData);
        setServicios(serviciosData);
        setStatus('success');
      } catch (err) {
        setError(err.friendlyMessage || 'No se pudieron cargar las solicitudes. Intente nuevamente.');
        setStatus('error');
      }
    };

    cargarSolicitudes();
  }, []);

  const serviciosMap = useMemo(() => {
    return servicios.reduce((acc, servicio) => {
      const key = servicio.codigo_servicio;
      if (!acc[key]) acc[key] = [];
      acc[key].push(servicio);
      return acc;
    }, {});
  }, [servicios]);

  const normalizeCategoria = (categoria) => {
    if (!categoria) return 'General';
    const cleaned = categoria.toString().trim();
    switch (cleaned) {
      case 'Deporte':
      case 'Deportes':
        return 'Deportes';
      case 'Salud':
      case 'Servicios Médicos':
        return 'Servicios Médicos';
      case 'Cultura':
      case 'Cultura y Eventos':
        return 'Cultura y Eventos';
      case 'Trámites Académicos':
      case 'Tramites Académicos':
        return 'Trámites Académicos';
      default:
        return cleaned;
    }
  };

  const solicitudesEnriquecidas = useMemo(() => {
    return solicitudes.map((solicitud) => {
      const serviciosRelacionados = serviciosMap[solicitud.codigo_servicio] || [];
      const servicioRelacionado = serviciosRelacionados.find((item) => item.nombre_sede === solicitud.sede) || serviciosRelacionados[0];
      const categoriaRaw = servicioRelacionado?.nombre_categoria || solicitud.categoria || 'General';

      return {
        ...solicitud,
        servicio: servicioRelacionado?.descripcion_detallada || solicitud.codigo_servicio,
        categoria: normalizeCategoria(categoriaRaw),
        montoUsd: Number(servicioRelacionado?.precio_final_sede ?? servicioRelacionado?.precio_base ?? 0),
        montoBs: Number(servicioRelacionado?.precio_final_sede ?? servicioRelacionado?.precio_base ?? 0),
        fechaEjecucion: solicitud.fecha_creacion || solicitud.fecha_ejecucion || new Date().toISOString(),
        estatusGeneral: solicitud.estatus_general || solicitud.estatusGeneral || 'Pendiente',
      };
    });
  }, [solicitudes, serviciosMap]);

  const solicitudesFiltradas = filtroCategoria === 'Todos'
    ? solicitudesEnriquecidas
    : solicitudesEnriquecidas.filter((s) => s.categoria === filtroCategoria);

  const getStatusVariant = (status) => {
    return status === 'completado' ? 'success' : 'info';
  };

  const columns = [
    {
      key: 'nro_solicitud',
      label: 'Nro. Control',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-ucab-green">#{row.nro_solicitud}</span>
      ),
    },
    {
      key: 'servicio',
      label: 'Servicio / Trámite Solicitado',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.servicio}</p>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">
            {row.categoria} • Sede {row.sede}
          </span>
        </div>
      ),
    },
    {
      key: 'fechaEjecucion',
      label: 'Fecha Creación',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-gray-700">{new Date(row.fechaEjecucion).toLocaleDateString('es-VE')}</span>
      ),
    },
    {
      key: 'montoUsd',
      label: 'Monto Estimado',
      sortable: true,
      render: (row) => (
        <div className="text-right sm:text-left">
          <p className="font-bold text-gray-900">${row.montoUsd.toFixed(2)} USD</p>
          <p className="text-[11px] text-gray-500">Bs. {row.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
      ),
    },
    {
      key: 'estatusGeneral',
      label: 'Estatus',
      sortable: true,
      render: (row) => <Badge label={row.estatusGeneral} status={getStatusVariant(row.estatusGeneral)} />, 
    },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/solicitudes/${row.nro_solicitud}`)}
            className="text-xs font-semibold text-ucab-blue hover:underline cursor-pointer"
          >
            Ver Detalle
          </button>
        </div>
      ),
    },
  ];

  const categorias = ['Todos', 'Deportes', 'Servicios Médicos', 'Trámites Académicos', 'Cultura y Eventos', 'Carnetización'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-ucab-green">Historial de Solicitudes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestione y consulte el estatus en tiempo real de sus solicitudes registradas en backend.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/solicitudes/nueva')} className="font-bold shadow-md shrink-0">
          + Nueva Solicitud de Servicio
        </Button>
      </div>

      {status === 'loading' && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Cargando solicitudes…</div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      )}

      {status === 'success' && (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 no-scrollbar">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filtroCategoria === cat
                    ? 'bg-ucab-green text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                }`}
              >
                {cat} {cat === 'Todos' ? `(${solicitudesEnriquecidas.length})` : `(${solicitudesEnriquecidas.filter((s) => s.categoria === cat).length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>💡 Haga clic en los encabezados de la columna para ordenar.</span>
              <span>Los montos son estimados según el catálogo de servicios.</span>
            </div>

            <DataTable
              columns={columns}
              data={solicitudesFiltradas}
              searchableColumns={['nro_solicitud', 'servicio', 'categoria', 'sede', 'estatusGeneral']}
              initialPageSize={5}
              emptyMessage="No se encontraron solicitudes registradas en esta categoría."
            />
          </div>
        </>
      )}
    </div>
  );
}
