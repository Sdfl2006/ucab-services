import React, { useState, useEffect } from 'react';
import { infrastructureService } from '../services/infrastructureService';
import DataTable from '../components/table/datatable';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GestionInfraestructura = () => {
  const { hasAnyRole } = useAuth();
  const [espacios, setEspacios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  if (!hasAnyRole('Admin', 'Personal_Administrativo')) {
    return <Navigate to="/dashboard" replace />;
  }

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      // Asumimos que el backend devuelve el array de espacios
      const dataEspacios = await infrastructureService.getEspacios();
      setEspacios(dataEspacios);
    } catch (error) {
      console.error("Error al cargar infraestructura:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para la HU-15: Cambiar estado a mantenimiento
  const toggleMantenimiento = async (nroIdentificador, estadoActual) => {
    const nuevoEstado = estadoActual === 'operativo' ? 'en mantenimiento' : 'operativo';
    try {
      await infrastructureService.updateEstadoEspacio(nroIdentificador, nuevoEstado);
      // Recargamos la tabla para reflejar el cambio
      cargarDatos();
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  };

  const columnasEspacios = [
    { header: 'ID Espacio', accessorKey: 'nro_identificador' },
    { header: 'Edificación', accessorKey: 'nombre_edificacion' },
    { header: 'Aforo', accessorKey: 'capacidad_max' },
    { 
      header: 'Disponibilidad (HU-16)', 
      accessorKey: 'estatus_disponibilidad',
      // Renderizamos un Badge dependiendo del estatus
      cell: (info) => (
        <Badge variant={info.getValue() === 'disponible' ? 'success' : 'danger'}>
          {info.getValue().toUpperCase()}
        </Badge>
      )
    },
    { 
      header: 'Mantenimiento (HU-15)', 
      accessorKey: 'estado_mantenimiento',
      cell: (info) => {
        const estado = info.getValue();
        const nroId = info.row.original.nro_identificador;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${estado === 'operativo' ? 'text-green-600' : 'text-orange-500'}`}>
              {estado}
            </span>
            <Button 
              size="sm" 
              variant={estado === 'operativo' ? 'warning' : 'primary'}
              onClick={() => toggleMantenimiento(nroId, estado)}
            >
              {estado === 'operativo' ? 'Bloquear' : 'Habilitar'}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Infraestructura</h1>
        <Button variant="primary">+ Nuevo Espacio</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card title="Sedes Activas" value="2 (Montalbán, Guayana)" />
        <Card title="Total Espacios" value={espacios.length || "0"} />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Inventario de Espacios Físicos</h2>
        {isLoading ? (
          <p>Cargando espacios...</p>
        ) : (
          <DataTable 
            columns={columnasEspacios} 
            data={espacios} 
          />
        )}
      </div>
    </div>
  );
};

export default GestionInfraestructura;