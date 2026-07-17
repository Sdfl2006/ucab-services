import React, { useState, useEffect } from 'react';
import beneficiaryService from '../services/beneficiaryService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
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

  const [beneficiaryStats, setBeneficiaryStats] = useState(null);
  const [profesorBeneficiarios, setProfesorBeneficiarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (esPersonalOperativo) {
      const fetchBeneficiaryStats = async () => {
        try {
          const adminData = await beneficiaryService.listarBeneficiariosAdmin();
          setBeneficiaryStats(adminData.stats || { total: 0, activos: 0, inactivos: 0, cargaMayor: 0, cargaMenor: 0 });
        } catch (error) {
          console.error('Error cargando estadísticas', error);
        }
      };
      fetchBeneficiaryStats();
    }
  }, [esPersonalOperativo]);

  useEffect(() => {
    if (esProfesor) {
      const fetchProfesorBeneficiarios = async () => {
        setIsLoading(true);
        try {
          const data = await beneficiaryService.listarMisBeneficiarios();
          setProfesorBeneficiarios(data);
        } catch (error) {
          console.error('Error al cargar los beneficiarios', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfesorBeneficiarios();
    }
  }, [esProfesor]);

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
          {/* Métricas discretas en lugar de una tabla invasiva */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-ucab-blue">
              <p className="text-xs font-bold text-gray-500 uppercase">Beneficiarios Registrados</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{beneficiaryStats?.total ?? '-'}</p>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Beneficios Activos</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{beneficiaryStats?.activos ?? '-'}</p>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Beneficios Inactivos</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{beneficiaryStats?.inactivos ?? '-'}</p>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <p className="text-xs font-bold text-gray-500 uppercase">Cargas Mayores</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{beneficiaryStats?.cargaMayor ?? '-'}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Panel de Control Administrativo" subtitle="Accesos rápidos a módulos operativos">
              <div className="flex flex-col gap-3 mt-4">
                <Button onClick={() => navigate('/taquilla')} variant="primary" className="w-full justify-start shadow-sm">
                  Taquilla y Pagos Presenciales
                </Button>
                <Button onClick={() => navigate('/beneficiarios')} variant="secondary" className="w-full justify-start">
                  Directorio de Beneficiarios
                </Button>
                <Button onClick={() => navigate('/solicitudes')} variant="secondary" className="w-full justify-start">
                  Bandeja de Solicitudes (Workflow)
                </Button>
                <Button onClick={() => navigate('/infraestructura')} variant="secondary" className="w-full justify-start">
                  Gestión de Infraestructura
                </Button>
                <Button onClick={() => navigate('/bolsa-trabajo')} variant="secondary" className="w-full justify-start">
                  Gestión de Vacantes Laborales
                </Button>
              </div>
            </Card>
            <Card title="Estado del Sistema">
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-800">Rol Activo:</span>
                  <Badge label={user?.rol?.replace('_', ' ')} status="ucab" size="sm" />
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-800">Sede de Operación:</span>
                  <span className="font-mono">{user?.sede || 'Montalbán'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Fecha del Sistema:</span>
                  <span>{new Date().toLocaleDateString('es-VE')}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Utilice el menú lateral o los accesos rápidos para gestionar los procesos de su dependencia.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : esProfesor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Panel de Docente" subtitle="Gestión de cargas familiares y servicios académicos">
            <div className="space-y-4 text-sm text-gray-700 mt-2">
              <p>Accede a tus beneficiarios, controla sus documentos universitarios y verifica estados de cobertura.</p>
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
            {isLoading ? (
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
          {/* Columna Izquierda */}
          <div className="space-y-6">
            <Card title="Accesos Rápidos" subtitle="Servicios más utilizados">
              <div className="flex flex-col gap-3 mt-4">
                <Button onClick={() => navigate('/solicitudes/nueva')} variant="primary" className="w-full justify-start shadow-sm">
                  + Nueva Solicitud de Servicio
                </Button>
                <Button onClick={() => navigate('/directorio-medico')} variant="secondary" className="w-full justify-start">
                  Directorio Médico
                </Button>
                <Button onClick={() => navigate('/pagos')} variant="secondary" className="w-full justify-start">
                  Mis Facturas y Pagos
                </Button>
                <Button onClick={() => navigate('/solicitudes')} variant="secondary" className="w-full justify-start">
                  Seguimiento de Trámites
                </Button>
              </div>
            </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            <Card title="Billetera TAI" subtitle="Tu carnet inteligente para consumos en campus">
              <div className="bg-gradient-to-br from-gray-900 via-ucab-blue to-ucab-green p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
                 {/* Efecto visual de fondo */}
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                 
                 <div className="flex justify-between items-center mb-1 relative z-10">
                   <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Saldo Virtual Disponible</p>
                   <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                   </svg>
                 </div>
                 <p className="text-4xl font-black relative z-10">$0.00 <span className="text-lg font-medium opacity-80">USD</span></p>
                 
                 <div className="mt-5 pt-4 border-t border-white/10 relative z-10 flex gap-3">
                    <Button variant="accent" size="sm" className="w-full font-bold shadow-lg" onClick={() => navigate('/pagos')}>
                      + Recargar Saldo
                    </Button>
                 </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Trámites Pendientes</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Recuerda revisar la pestaña de <b>Solicitudes</b> para verificar si tienes pagos o requisitos pendientes por entregar.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;