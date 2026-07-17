import React, { useState, useEffect } from 'react';
import { jobBoardService } from '../services/jobBoardService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/table/DataTable';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';

const BolsaTrabajo = () => {
  const { user, hasAnyRole } = useAuth();
  const esAdministrador = hasAnyRole('Admin', 'Personal_Administrativo');

  const [vacantes, setVacantes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el Modal de Crear Vacante
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [nuevaVacante, setNuevaVacante] = useState({
    nombre_entidad: '',
    cargo: '',
    responsabilidades: '',
    beneficios: '',
    perfil_buscado: ''
  });

  const cargarBolsa = async () => {
    try {
      setIsLoading(true);
      const dataVacantes = await jobBoardService.getVacantes();
      setVacantes(dataVacantes || []);

      if (user && String(user.rol).toLowerCase() === 'egresado') {
        const dataSugerencias = await jobBoardService.getSugerencias();
        setSugerencias(dataSugerencias || []);
      }
    } catch (error) {
      console.error("Error al cargar la bolsa de trabajo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarBolsa();
  }, [user]);

  const handlePostular = async (idVacante, entidad, cargo, fecha) => {
    try {
      await jobBoardService.postular({ 
        nombre_entidad: entidad, 
        cargo: cargo, 
        fecha_oferta: fecha 
      });
      alert("¡Postulación enviada con éxito! La empresa evaluará tu perfil.");
    } catch (error) {
      alert(error.friendlyMessage || "Hubo un error al procesar tu postulación.");
    }
  };

  const handleCrearVacante = async (e) => {
    e.preventDefault();
    setErrorFormulario(null);
    setGuardando(true);
    try {
      await jobBoardService.createVacante(nuevaVacante);
      setMostrarModal(false);
      setNuevaVacante({ nombre_entidad: '', cargo: '', responsabilidades: '', beneficios: '', perfil_buscado: '' });
      cargarBolsa(); // Refrescamos la tabla
      alert("Vacante publicada exitosamente.");
    } catch (error) {
      setErrorFormulario(error.friendlyMessage || 'Error al publicar la vacante. Verifique que la empresa sea un Aliado Externo registrado.');
    } finally {
      setGuardando(false);
    }
  };

  const columnasVacantes = [
    { header: 'Empresa', accessorKey: 'nombre_entidad', render: (row) => <span className="font-bold text-gray-800">{row.nombre_entidad}</span> },
    { header: 'Cargo', accessorKey: 'cargo', render: (row) => <span>{row.cargo}</span> },
    { header: 'Perfil Buscado', accessorKey: 'perfil_buscado', render: (row) => <span className="text-xs text-gray-600">{row.perfil_buscado}</span> },
    { 
      header: 'Estatus', 
      accessorKey: 'estatus_vacante',
      render: (row) => (
        <Badge 
          label={row.estatus_vacante?.toUpperCase()} 
          status={row.estatus_vacante === 'disponible' ? 'success' : 'default'} 
          size="sm" 
        />
      )
    }
  ];

  // Si es Egresado, le agregamos el botón de postularse
  if (user && String(user.rol).toLowerCase() === 'egresado') {
    columnasVacantes.push({
      header: 'Acción',
      key: 'acciones',
      sortable: false,
      render: (row) => (
        <Button 
          size="sm" 
          variant="primary" 
          disabled={row.estatus_vacante !== 'disponible'}
          onClick={() => handlePostular(row.id_vacante, row.nombre_entidad, row.cargo, row.fecha_oferta)}
        >
          Postularme
        </Button>
      )
    });
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-ucab-green">Bolsa de Trabajo UCAB</h1>
          <p className="text-sm text-gray-500 mt-1">Conectando talento universitario con los mejores aliados comerciales.</p>
        </div>
        {esAdministrador && (
          <Button variant="primary" onClick={() => setMostrarModal(true)} className="shadow-md">
            + Publicar Vacante
          </Button>
        )}
      </div>

      {sugerencias.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-black uppercase text-ucab-green mb-3 tracking-widest">Sugerencias Inteligentes para ti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sugerencias.map((sug, index) => (
              <Card key={index} className="border-l-4 border-l-ucab-yellow shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">{sug.nivel_relevancia}</span>
                  <span className="text-xs text-gray-400 font-mono">{new Date(sug.fecha_oferta).toLocaleDateString('es-VE')}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{sug.cargo}</h3>
                <p className="text-sm font-semibold text-ucab-blue mb-3">{sug.razon_social || sug.nombre_entidad}</p>
                <div className="space-y-1 mb-4 text-xs text-gray-600">
                  <p><b>Responsabilidades:</b> {sug.responsabilidades}</p>
                  <p><b>Beneficios:</b> {sug.beneficios}</p>
                </div>
                <Button size="sm" onClick={() => handlePostular(sug.id_vacante, sug.nombre_entidad, sug.cargo, sug.fecha_oferta)}>
                  Aplicar a esta oferta
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card title="Directorio General de Vacantes">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-4">Cargando ofertas laborales...</p>
        ) : (
          <DataTable 
            columns={columnasVacantes} 
            data={vacantes} 
            searchableColumns={['nombre_entidad', 'cargo', 'perfil_buscado']}
            initialPageSize={10}
            emptyMessage="No hay vacantes disponibles en este momento."
          />
        )}
      </Card>

      {/* MODAL PARA PUBLICAR VACANTE (SOLO ADMIN) */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-ucab-green px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-black text-lg">Publicar Nueva Oferta Laboral</h3>
              <button onClick={() => setMostrarModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCrearVacante} className="p-6 space-y-4">
              {errorFormulario && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  {errorFormulario}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Empresa (Entidad Externa)" 
                  placeholder="Ej: Eventos Caracas C.A." 
                  value={nuevaVacante.nombre_entidad} 
                  onChange={(e) => setNuevaVacante({...nuevaVacante, nombre_entidad: e.target.value})} 
                  required 
                />
                <Input 
                  label="Cargo Ofrecido" 
                  placeholder="Ej: Analista de Datos" 
                  value={nuevaVacante.cargo} 
                  onChange={(e) => setNuevaVacante({...nuevaVacante, cargo: e.target.value})} 
                  required 
                />
              </div>
              <Input 
                label="Perfil Buscado" 
                placeholder="Ej: Egresado de Ingeniería con promedio > 15" 
                value={nuevaVacante.perfil_buscado} 
                onChange={(e) => setNuevaVacante({...nuevaVacante, perfil_buscado: e.target.value})} 
                required 
              />
              <Input 
                label="Responsabilidades" 
                placeholder="Ej: Análisis de métricas y mantenimiento de BD" 
                value={nuevaVacante.responsabilidades} 
                onChange={(e) => setNuevaVacante({...nuevaVacante, responsabilidades: e.target.value})} 
                required 
              />
              <Input 
                label="Beneficios" 
                placeholder="Ej: HCM, Trabajo Remoto, Bonos" 
                value={nuevaVacante.beneficios} 
                onChange={(e) => setNuevaVacante({...nuevaVacante, beneficios: e.target.value})} 
                required 
              />
              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="w-1/2" onClick={() => setMostrarModal(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="w-1/2" loading={guardando}>Publicar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BolsaTrabajo;