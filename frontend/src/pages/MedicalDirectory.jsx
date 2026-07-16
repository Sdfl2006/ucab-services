import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_DIRECTORIO_MEDICO, TASA_BCV } from '../services/mockData';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function MedicalDirectory() {
  const [filtroSede, setFiltroSede] = useState('Todas');
  const navigate = useNavigate();

  const medicosFiltrados = filtroSede === 'Todas'
    ? MOCK_DIRECTORIO_MEDICO
    : MOCK_DIRECTORIO_MEDICO.filter(m => m.sede === filtroSede);

  const columns = [
    {
      key: 'nombre',
      label: 'Profesional de la Salud',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
            {row.nombre.replace('Dra. ', '').replace('Dr. ', '')[0]}
          </div>
          <div>
            <p className="font-bold text-gray-900">{row.nombre}</p>
            <span className="text-xs font-semibold text-ucab-green">{row.especialidad}</span>
          </div>
        </div>
      )
    },
    {
      key: 'sede',
      label: 'Campus / Consultorio',
      sortable: true,
      render: (row) => (
        <div>
          <Badge label={`Sede ${row.sede}`} status="ucab" size="sm" />
          <p className="text-xs text-gray-600 mt-1">{row.consultorio}</p>
        </div>
      )
    },
    {
      key: 'horario',
      label: 'Horario de Atención',
      sortable: false,
      render: (row) => (
        <span className="text-xs text-gray-700 font-medium">{row.horario}</span>
      )
    },
    {
      key: 'costoUsd',
      label: 'Tarifa Estudiantil',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900">${row.costoUsd} USD</p>
          <p className="text-[11px] text-gray-500">Bs. {(row.costoUsd * TASA_BCV).toLocaleString('es-VE')}</p>
        </div>
      )
    },
    {
      key: 'disponible',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <Badge
          label={row.disponible ? 'Citas Disponibles' : 'Agenda Lleno / Ausente'}
          status={row.disponible ? 'success' : 'error'}
          size="sm"
        />
      )
    },
    {
      key: 'acciones',
      label: 'Acción',
      sortable: false,
      render: (row) => (
        <Button
          size="sm"
          variant={row.disponible ? 'primary' : 'ghost'}
          disabled={!row.disponible}
          onClick={() => navigate(`/solicitudes/nueva?categoria=Servicios Médicos&servicio=${encodeURIComponent(row.nombre)}`)}
        >
          Agendar Cita
        </Button>
      )
    }
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
          {['Todas', 'Montalbán', 'Guayana'].map((sede) => (
            <button
              key={sede}
              onClick={() => setFiltroSede(sede)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroSede === sede ? 'bg-white text-ucab-blue shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              {sede}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={medicosFiltrados}
          searchableColumns={['nombre', 'especialidad', 'sede', 'consultorio']}
          initialPageSize={5}
          emptyMessage="No se encontraron médicos en la sede seleccionada."
        />
      </div>

    </div>
  );
}