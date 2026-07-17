import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceService from '../services/serviceService';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function MedicalDirectory() {
  const [filtroSede, setFiltroSede] = useState('Todas');
  const [servicios, setServicios] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarServicios = async () => {
      setStatus('loading');
      try {
        const data = await serviceService.getAllServices();
        setServicios(data);
        setStatus('success');
      } catch (err) {
        setError(err.friendlyMessage || 'No se pudieron cargar los servicios médicos.');
        setStatus('error');
      }
    };

    cargarServicios();
  }, []);

  const medicos = useMemo(() => {
    return servicios.filter((servicio) => {
      const categoria = (servicio.nombre_categoria || '').toLowerCase();
      return categoria.includes('médico') || categoria.includes('medico') || categoria.includes('salud');
    });
  }, [servicios]);

  const medicosFiltrados = filtroSede === 'Todas'
    ? medicos
    : medicos.filter((item) => item.nombre_sede === filtroSede);

  const columns = [
    {
      key: 'descripcion_detallada',
      label: 'Servicio',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
            {row.descripcion_detallada?.[0] || row.codigo_servicio?.[0]}
          </div>
          <div>
            <p className="font-bold text-gray-900">{row.descripcion_detallada || row.codigo_servicio}</p>
            <span className="text-xs font-semibold text-ucab-green">{row.entidad_prestadora || 'UCAB'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'nombre_sede',
      label: 'Campus / Sede',
      sortable: true,
      render: (row) => (
        <div>
          <Badge label={`Sede ${row.nombre_sede}`} status="ucab" size="sm" />
          <p className="text-xs text-gray-600 mt-1">Categoría: {row.nombre_categoria}</p>
        </div>
      ),
    },
    {
      key: 'horario',
      label: 'Horario de Atención',
      sortable: false,
      render: () => (
        <span className="text-xs text-gray-700 font-medium">Agendamiento sujeto a disponibilidad de la sede</span>
      ),
    },
    {
      key: 'precio_final_sede',
      label: 'Tarifa Estudiantil',
      sortable: true,
      render: (row) => {
        const precio = Number(row.precio_final_sede ?? row.precio_base ?? 0);
        return (
          <div>
            <p className="font-bold text-gray-900">${precio.toFixed(2)} USD</p>
            <p className="text-[11px] text-gray-500">Bs. {precio.toLocaleString('es-VE')}</p>
          </div>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acción',
      sortable: false,
      render: (row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => navigate(`/solicitudes/nueva?categoria=Servicios Médicos&servicio=${encodeURIComponent(row.descripcion_detallada || row.codigo_servicio)}`)}
        >
          Agendar Cita
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-ucab-blue to-ucab-green p-6 sm:p-8 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Directorio y Servicios Médicos UCAB</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            Red de atención primaria, psicología y odontología para estudiantes y personal administrativo.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 self-start sm:self-auto">
          {['Todas', 'Montalbán', 'Guayana'].map((sedeOption) => (
            <button
              key={sedeOption}
              onClick={() => setFiltroSede(sedeOption)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroSede === sedeOption ? 'bg-white text-ucab-blue shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              {sedeOption}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Cargando catálogo de servicios médicos...</div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={medicosFiltrados}
          searchableColumns={['descripcion_detallada', 'entidad_prestadora', 'nombre_sede', 'nombre_categoria']}
          initialPageSize={5}
          emptyMessage="No se encontraron servicios médicos en la sede seleccionada."
        />
      </div>
    </div>
  );
}
