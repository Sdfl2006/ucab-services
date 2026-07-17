import React, { useState, useEffect } from 'react';
import beneficiaryService from '../services/beneficiaryService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import DataTable from '../components/table/DataTable';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  const esAdmin = hasAnyRole('Admin');
  const esPersonalAdministrativo = hasAnyRole('Personal_Administrativo');
  const esPersonalOperativo = esAdmin || esPersonalAdministrativo;
  const esProfesor = hasAnyRole('Profesor');

  // Estados para Administradores
  const [beneficiaryStats, setBeneficiaryStats] = useState(null);
  const [beneficiariosList, setBeneficiariosList] = useState([]);
  const [isLoadingBeneficiaryStats, setIsLoadingBeneficiaryStats] = useState(false);
  const [beneficiaryError, setBeneficiaryError] = useState(null);

  // Estados para Profesores
  const [profesorBeneficiarios, setProfesorBeneficiarios] = useState([]);
  const [isLoadingProfesorBeneficiarios, setIsLoadingProfesorBeneficiarios] = useState(false);

  // Cargar datos si es Admin o Personal Administrativo
  useEffect(() => {
    if (esPersonalOperativo) {
      const fetchBeneficiaryStats = async () => {
        try {
          setIsLoadingBeneficiaryStats(true);
          const adminData = await beneficiaryService.listarBeneficiariosAdmin();
          setBeneficiaryStats(adminData.stats || {
            total: 0,
            activos: 0,
            inactivos: 0,
            cargaMayor: 0,
            cargaMenor: 0,
          });
          setBeneficiariosList(adminData.data || []);
        } catch (error) {
          setBeneficiaryError(error.friendlyMessage || 'No se pudieron cargar los datos de beneficiarios.');
        } finally {
          setIsLoadingBeneficiaryStats(false);
        }
      };
      fetchBeneficiaryStats();
    }
  }, [esPersonalOperativo]);

  // Cargar datos si es Profesor
  useEffect(() => {
    if (esProfesor) {
      const fetchProfesorBeneficiarios = async () => {
        try {
          setIsLoadingProfesorBeneficiarios(true);
          const data = await beneficiaryService.listarMisBeneficiarios();
          setProfesorBeneficiarios(data);
        } catch (error) {
          console.error('Error al cargar los beneficiarios del profesor:', error);
        } finally {
          setIsLoadingProfesorBeneficiarios(false);
        }
      };
      fetchProfesorBeneficiarios();
    }
  }, [esProfesor]);

  const columnasBeneficiariosAdmin = [
    {
      key: 'titular',
      label: 'C.I. Titular',
      sortable: true,
      render: (row) => <span className="font-mono text-gray-500">{row.cedula_titular}</span>
    },
    {
      key: 'nombres',
      label: 'Beneficiario',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.nombres} {row.apellidos}</p>
          <span className="text-[11px] text-gray-500 font-mono">CI: {row.cedula_beneficiario}</span>
        </div>
      )
    },
    {
      key: 'parentesco',
      label: 'Parentesco',
      sortable: true,
      render: (row) => <span className="capitalize text-gray-700">{row.parentesco}</span>
    },
    {
      key: 'tipo_carga',
      label: 'Tipo de Carga',
      sortable: true,
      render: (row) => <span className="text-gray-700 font-medium">{row.tipo_carga?.replace('_', ' ')}</span>
    },
    {
      key: 'beneficios_activos',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <Badge
          label={row.beneficios_activos ? 'Activos' : 'Inactivos'}
          status={row.beneficios_activos ? 'success' : 'warning'}
          size="sm"
        />
      )
    }
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <h1 className="text-2xl font-black text-ucab-green mb-1">
        Bienvenido a UCAB-Services, {user?.nombres}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Plataforma integrada de gestión de servicios.
      </p>

      {esPersonalOperativo ? (
        <>
          {/* Tarjetas Superiores para Admin */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-ucab-blue">
              <p className="text-xs font-bold text-gray-500 uppercase">Total Beneficiarios</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{beneficiaryStats?.total ?? '0'}</p>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Beneficios Activos</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{beneficiaryStats?.activos ?? '0'}</p>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Beneficios Inactivos</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{beneficiaryStats?.inactivos ?? '0'}</p>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Cargas Mayores</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{beneficiaryStats?.cargaMayor ?? '0'}</p>
            </Card>
          </div>

          {/* Tabla General de Beneficiarios */}
          <Card title="Directorio General de Beneficiarios" subtitle="Listado administrativo de cargas familiares registradas (HU-09 / HU-10)">
            {isLoadingBeneficiaryStats ? (
              <p className="text-sm text-gray-500 py-4 text-center">Cargando directorio de beneficiarios...</p>
            ) : beneficiaryError ? (
              <p className="text-sm text-red-600 p-4 bg-red-50 rounded-lg">{beneficiaryError}</p>
            ) : (
              <DataTable 
                columns={columnasBeneficiariosAdmin} 
                data={beneficiariosList} 
                searchableColumns={['nombres', 'apellidos', 'cedula_beneficiario', 'cedula_titular']}
                initialPageSize={5}
                emptyMessage="No hay beneficiarios registrados en el sistema."
              />
            )}
          </Card>
        </>
      ) : esProfesor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Panel de Docente" subtitle="Gestión de cargas familiares y servicios académicos">
            <div className="space-y-4 text-sm text-gray-700 mt-2">
              <p>Accede a tus beneficiarios, controla sus documentos universitarios y verifica estados de cobertura (HU-09).</p>
              <div className="flex flex-col gap-3 mt-4">
                <Button onClick={() => navigate('/perfil')} variant="primary" className="w-full justify-start">
                  Ver mi panel de beneficiarios
                </Button>
                <Button onClick={() => navigate('/solicitudes')} variant="secondary" className="w-full justify-start">
                  Mis solicitudes de servicio
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Mis Beneficiarios Registrados">
            {isLoadingProfesorBeneficiarios ? (
              <p className="text-sm text-gray-500">Cargando beneficiarios...</p>
            ) : profesorBeneficiarios.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No tienes cargas familiares registradas actualmente.</p>
            ) : (
              <div className="grid gap-3 mt-2">
                {profesorBeneficiarios.slice(0, 4).map((benef) => (
                  <div key={benef.cedula_beneficiario} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{benef.nombres} {benef.apellidos}</p>
                      <p className="text-[11px] text-gray-500 uppercase">{benef.parentesco} • {benef.tipo_carga?.replace('_', ' ')}</p>
                    </div>
                    <Badge 
                      label={benef.beneficios_activos ? 'Activos' : 'Inactivos'} 
                      status={benef.beneficios_activos ? 'success' : 'warning'} 
                      size="sm" 
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Accesos Rápidos" subtitle="Servicios más utilizados">
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={() => navigate('/solicitudes/nueva')} variant="primary" className="w-full justify-start">
                + Nueva Solicitud de Servicio
              </Button>
              <Button onClick={() => navigate('/directorio-medico')} variant="secondary" className="w-full justify-start">
                Directorio Médico
              </Button>
              <Button onClick={() => navigate('/pagos')} variant="secondary" className="w-full justify-start">
                Mis Facturas y Pagos
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;