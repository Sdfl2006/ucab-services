import React, { useState, useEffect } from 'react';
import { jobBoardService } from '../services/jobBoardService';
import { useAuth } from '../context/AuthContext'; // Para obtener la cédula del usuario activo
import DataTable from '../components/table/datatable';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const BolsaTrabajo = () => {
  const { user } = useAuth(); // Extraemos los datos de la sesión actual
  const [vacantes, setVacantes] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarBolsa = async () => {
      try {
        setIsLoading(true);
        // Traemos todas las vacantes
        const dataVacantes = await jobBoardService.getVacantes();
        setVacantes(dataVacantes);

        // Si el usuario es un Egresado, buscamos sugerencias inteligentes
        if (user && user.rol === 'egresado') {
          const dataSugerencias = await jobBoardService.getSugerencias(user.cedula);
          setSugerencias(dataSugerencias);
        }
      } catch (error) {
        console.error("Error al cargar la bolsa de trabajo:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarBolsa();
  }, [user]);

  const handlePostular = async (idVacante) => {
    try {
      await jobBoardService.postular({ cedula: user.cedula, id_vacante: idVacante });
      alert("¡Postulación enviada con éxito!");
      // Aquí se podría actualizar el estado local para reflejar la postulación
    } catch (error) {
      console.error("Error al postularse:", error);
      alert("Hubo un error al procesar tu postulación.");
    }
  };

  const columnasVacantes = [
    { header: 'Empresa', accessorKey: 'nombre_entidad' },
    { header: 'Cargo', accessorKey: 'cargo' },
    { header: 'Perfil Buscado', accessorKey: 'perfil_buscado' },
    { 
      header: 'Estatus', 
      accessorKey: 'estatus_vacante',
      cell: (info) => (
        <Badge variant={info.getValue() === 'disponible' ? 'success' : 'secondary'}>
          {info.getValue().toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Acción',
      id: 'acciones',
      cell: (info) => {
        const vacante = info.row.original;
        return (
          <Button 
            size="sm" 
            variant="primary" 
            disabled={vacante.estatus_vacante !== 'disponible'}
            onClick={() => handlePostular(vacante.id_vacante)}
          >
            Postularme
          </Button>
        );
      }
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bolsa de Trabajo UCAB</h1>

      {/* Sección HU-25: Sugerencias Inteligentes (Solo visible si hay sugerencias) */}
      {sugerencias.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-ucab-green">Sugerencias Inteligentes para ti</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sugerencias.map((sug, index) => (
              <Card 
                key={index} 
                title={sug.cargo} 
                value={sug.nombre_entidad} 
              >
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-4">{sug.beneficios}</p>
                  <Button size="sm" onClick={() => handlePostular(sug.id_vacante)}>
                    Aplicar Ahora
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sección HU-24: Directorio General */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Directorio de Vacantes</h2>
        {isLoading ? (
          <p>Cargando ofertas laborales...</p>
        ) : (
          <DataTable 
            columns={columnasVacantes} 
            data={vacantes} 
          />
        )}
      </div>
    </div>
  );
};

export default BolsaTrabajo;