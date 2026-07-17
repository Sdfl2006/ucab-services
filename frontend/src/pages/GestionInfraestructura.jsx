import React, { useState, useEffect } from 'react';
import { infrastructureService } from '../services/infrastructureService';
import DataTable from '../components/table/DataTable';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GestionInfraestructura = () => {
  const { hasAnyRole } = useAuth();
  const [espacios, setEspacios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [nuevoEspacio, setNuevoEspacio] = useState({
    nro_identificador: '',
    nombre_edificacion: 'Edificio Cincuentenario',
    capacidad_max: '',
    tipo_mobiliario: '',
    recursos_tecnologicos: ''
  });

  if (!hasAnyRole('Admin', 'Personal_Administrativo')) {
    return <Navigate to="/dashboard" replace />;
  }

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const dataEspacios = await infrastructureService.getEspacios();
      setEspacios(dataEspacios || []);
    } catch (error) {
      console.error("Error al cargar infraestructura:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleMantenimiento = async (nroIdentificador, estadoActual) => {
    const ponerEnMantenimiento = estadoActual === 'operativo'; 
    try {
      await infrastructureService.updateEstadoEspacio(nroIdentificador, ponerEnMantenimiento);
      cargarDatos(); 
    } catch (error) {
      alert("Error al actualizar el estado: " + (error.friendlyMessage || error.message));
    }
  };

  const handleCrearEspacio = async (e) => {
    e.preventDefault();
    setErrorFormulario(null);
    setGuardando(true);
    try {
      await infrastructureService.createEspacio({
        ...nuevoEspacio,
        capacidad_max: Number(nuevoEspacio.capacidad_max)
      });
      setMostrarModal(false);
      setNuevoEspacio({
        nro_identificador: '',
        nombre_edificacion: 'Edificio Cincuentenario',
        capacidad_max: '',
        tipo_mobiliario: '',
        recursos_tecnologicos: ''
      });
      cargarDatos();
      alert("Espacio físico registrado exitosamente en el inventario.");
    } catch (error) {
      setErrorFormulario(error.friendlyMessage || 'Error al registrar el espacio. Verifica que el identificador no esté repetido.');
    } finally {
      setGuardando(false);
    }
  };

  const columnasEspacios = [
    { label: 'ID Espacio', key: 'nro_identificador', sortable: true },
    { label: 'Edificación', key: 'nombre_edificacion', sortable: true },
    { label: 'Aforo', key: 'capacidad_max', sortable: true },
    { 
      label: 'Disponibilidad', 
      key: 'estatus_disponibilidad',
      sortable: true,
      render: (row) => (
        <Badge 
          label={row.estatus_disponibilidad?.toUpperCase()}
          status={row.estatus_disponibilidad === 'disponible' ? 'success' : 'error'} 
          size="sm"
        />
      )
    },
    { 
      label: 'Mantenimiento (HU-15)', 
      key: 'estado_mantenimiento',
      sortable: false,
      render: (row) => {
        const estado = row.estado_mantenimiento;
        const nroId = row.nro_identificador;
        const esOperativo = estado === 'operativo';
        
        return (
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[11px] font-bold uppercase ${esOperativo ? 'text-emerald-600' : 'text-amber-600'}`}>
              {estado}
            </span>
            <Button 
               size="sm" 
               variant={esOperativo ? 'secondary' : 'primary'}
               onClick={() => toggleMantenimiento(nroId, estado)}
            >
              {esOperativo ? 'Bloquear' : 'Habilitar'}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-ucab-green">Gestión de Infraestructura</h1>
          <p className="text-sm text-gray-500 mt-1">Control de espacios, aforos y bloqueos por mantenimiento.</p>
        </div>
        <Button variant="primary" onClick={() => setMostrarModal(true)} className="shadow-md">
          + Nuevo Espacio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card title="Sedes Activas" value="2 (Montalbán, Guayana)" className="border-l-4 border-l-ucab-blue">
          <p className="text-2xl font-black text-gray-800 mt-2">2</p>
          <p className="text-xs text-gray-500 mt-1">Montalbán, Guayana</p>
        </Card>
        <Card title="Total Espacios Registrados" className="border-l-4 border-l-ucab-green">
          <p className="text-2xl font-black text-ucab-green mt-2">{espacios.length}</p>
          <p className="text-xs text-gray-500 mt-1">Operativos y en mantenimiento</p>
        </Card>
      </div>

      <Card title="Inventario de Espacios Físicos">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-4">Cargando espacios...</p>
        ) : (
          <DataTable 
            columns={columnasEspacios} 
            data={espacios} 
            searchableColumns={['nro_identificador', 'nombre_edificacion']}
            initialPageSize={10}
          />
        )}
      </Card>

      {/* MODAL PARA CREAR NUEVO ESPACIO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-ucab-green px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg">Registrar Nuevo Espacio Físico</h3>
              <button onClick={() => setMostrarModal(false)} className="text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCrearEspacio} className="p-6 space-y-4">
              {errorFormulario && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {errorFormulario}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Identificador Único" 
                  placeholder="Ej: MON-LAB-203" 
                  value={nuevoEspacio.nro_identificador} 
                  onChange={(e) => setNuevoEspacio({...nuevoEspacio, nro_identificador: e.target.value.toUpperCase()})} 
                  required 
                />
                <Input 
                  label="Capacidad Máxima (Aforo)" 
                  type="number"
                  min="1"
                  placeholder="Ej: 30" 
                  value={nuevoEspacio.capacidad_max} 
                  onChange={(e) => setNuevoEspacio({...nuevoEspacio, capacidad_max: e.target.value})} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Edificación / Complejo <span className="text-red-500">*</span></label>
                <select 
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green"
                  value={nuevoEspacio.nombre_edificacion}
                  onChange={(e) => setNuevoEspacio({...nuevoEspacio, nombre_edificacion: e.target.value})}
                  required
                >
                  <option value="Edificio Cincuentenario">Edificio Cincuentenario (Montalbán)</option>
                  <option value="Edificio de Laboratorios">Edificio de Laboratorios (Montalbán)</option>
                  <option value="Edificio Rectorado">Edificio Rectorado (Montalbán)</option>
                  <option value="Edificio Aula Magna Guayana">Edificio Aula Magna Guayana</option>
                  <option value="Complejo Deportivo Guayana">Complejo Deportivo Guayana</option>
                </select>
              </div>

              <Input 
                label="Tipo de Mobiliario" 
                placeholder="Ej: Mesas técnicas, pupitres, butacas..." 
                value={nuevoEspacio.tipo_mobiliario} 
                onChange={(e) => setNuevoEspacio({...nuevoEspacio, tipo_mobiliario: e.target.value})} 
                required 
              />
              <Input 
                label="Recursos Tecnológicos instalados" 
                placeholder="Ej: 25 PC, Proyector, Aire Acondicionado..." 
                value={nuevoEspacio.recursos_tecnologicos} 
                onChange={(e) => setNuevoEspacio({...nuevoEspacio, recursos_tecnologicos: e.target.value})} 
                required 
              />
              
              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="w-1/2" onClick={() => setMostrarModal(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="w-1/2" loading={guardando}>Registrar Espacio</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionInfraestructura;