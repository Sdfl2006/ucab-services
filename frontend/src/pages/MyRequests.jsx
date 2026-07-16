import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_SOLICITUDES_INICIALES, TASA_BCV } from '../services/mockData';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function MyRequests() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const navigate = useNavigate();

  // Cargamos las solicitudes (simulando fetch desde API o localStorage para persistencia en demostración)
  useEffect(() => {
    const stored = localStorage.getItem('ucab_user_requests');
    if (stored) {
      setSolicitudes(JSON.parse(stored));
    } else {
      setSolicitudes(MOCK_SOLICITUDES_INICIALES);
      localStorage.setItem('ucab_user_requests', JSON.stringify(MOCK_SOLICITUDES_INICIALES));
    }
  }, []);

  // Filtrado rápido por pestañas de categoría
  const solicitudesFiltradas = filtroCategoria === 'Todos'
    ? solicitudes
    : solicitudes.filter(s => s.categoria === filtroCategoria);

  // Mapeo de estatus para nuestro componente Badge
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Aprobado': return 'success';
      case 'Pendiente': return 'warning';
      case 'En Proceso': return 'info';
      case 'Culminado': return 'ucab';
      case 'Rechazado': return 'error';
      default: return 'default';
    }
  };

  // Configuración de columnas para nuestro <DataTable /> (Rúbrica)
  const columns = [
    {
      key: 'nroSolicitud',
      label: 'Nro. Control',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-ucab-green">#{row.nroSolicitud}</span>
      )
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
      )
    },
    {
      key: 'fechaEjecucion',
      label: 'Fecha Programada',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-gray-700">{row.fechaEjecucion}</span>
      )
    },
    {
      key: 'montoUsd',
      label: 'Monto Total',
      sortable: true,
      render: (row) => (
        <div className="text-right sm:text-left">
          <p className="font-bold text-gray-900">${row.montoUsd.toFixed(2)} USD</p>
          <p className="text-[11px] text-gray-500">Bs. {row.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
      )
    },
    {
      key: 'estatusGeneral',
      label: 'Estatus',
      sortable: true,
      render: (row) => (
        <Badge label={row.estatusGeneral} status={getStatusVariant(row.estatusGeneral)} />
      )
    },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.estatusGeneral === 'Aprobado' || row.estatusGeneral === 'Culminado' ? (
            <Button size="sm" variant="secondary" onClick={() => navigate('/pagos')}>
              Ver Factura
            </Button>
          ) : (
            <button
              onClick={() => alert(`Detalle de solicitud #${row.nroSolicitud}\nAcompañantes registrados: ${row.acompanantes?.length || 0}\nCreada el: ${row.fechaCreacion}`)}
              className="text-xs font-semibold text-ucab-blue hover:underline cursor-pointer"
            >
              Ver Detalle
            </button>
          )}
        </div>
      )
    }
  ];

  const categorias = ['Todos', 'Deportes', 'Servicios Médicos', 'Trámites Académicos', 'Cultura y Eventos', 'Carnetización'];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Cabecera de Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-ucab-green">Historial de Solicitudes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestione, consulte el estatus en tiempo real y revise los comprobantes de sus servicios universitarios.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/solicitudes/nueva')} className="font-bold shadow-md shrink-0">
          + Nueva Solicitud de Servicio
        </Button>
      </div>

      {/* Pestañas de Filtrado por Categoría */}
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
            {cat} {cat === 'Todos' ? `(${solicitudes.length})` : `(${solicitudes.filter(s => s.categoria === cat).length})`}
          </button>
        ))}
      </div>

      {/* RÚBRICA: Tabla Inteligente con Paginación, Búsqueda y Ordenamiento */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>💡 Haga clic en los encabezados de la columna para ordenar (Ascedente/Descendente).</span>
          <span>Tasa BCV: <b>{TASA_BCV} Bs/$</b></span>
        </div>

        <DataTable
          columns={columns}
          data={solicitudesFiltradas}
          searchableColumns={['nroSolicitud', 'servicio', 'categoria', 'sede', 'estatusGeneral']}
          initialPageSize={5}
          emptyMessage="No se encontraron solicitudes registradas en esta categoría."
        />
      </div>

    </div>
  );
}