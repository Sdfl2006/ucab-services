import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import DataTable from '../components/table/datatable';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const esPersonalOperativo = hasAnyRole('Admin', 'Personal_Administrativo');
  
  const [ingresosData, setIngresosData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Solo cargamos los reportes si el usuario tiene rol administrativo
    if (esPersonalOperativo) {
      const fetchReportes = async () => {
        try {
          setIsLoading(true);
          const ingresos = await reportService.getIngresos();
          setIngresosData(ingresos);
        } catch (error) {
          console.error("Error al cargar los reportes:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportes();
    }
  }, [esPersonalOperativo]);

  const columnasIngresos = [
    { header: 'Sede', accessorKey: 'sede' },
    { header: 'Categoría', accessorKey: 'categoria' },
    { header: 'Servicio', accessorKey: 'servicio' },
    { header: 'Facturado ($)', accessorKey: 'total_facturado' },
    { header: 'Cobrado ($)', accessorKey: 'total_cobrado' },
    { header: 'Saldo Pendiente', accessorKey: 'saldo_por_cobrar' }
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <h1 className="text-2xl font-black text-ucab-green mb-1">
        Bienvenido a UCAB-Services, {user?.nombres}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Plataforma integrada de gestión de servicios.
      </p>
      
      {/* VISTA PARA ADMINISTRADORES */}
      {esPersonalOperativo ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card title="Total Ingresos" value="Cargando..." />
            <Card title="Trámites Pendientes" value="Cargando..." />
            <Card title="Alertas de Seguridad" value="Cargando..." />
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Ingresos por Sede y Categoría (HU-35)</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500">Cargando datos financieros...</p>
            ) : (
              <DataTable columns={columnasIngresos} data={ingresosData} />
            )}
          </div>
        </>
      ) : (
        /* VISTA PARA ESTUDIANTES Y PROFESORES */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Accesos Rápidos" subtitle="Servicios más utilizados">
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={() => navigate('/solicitudes/nueva')} variant="primary" className="w-full justify-start">
                + Nueva Solicitud de Servicio
              </Button>
              <Button onClick={() => navigate('/directorio-medico')} variant="secondary" className="w-full justify-start">
                🩺 Directorio Médico
              </Button>
              <Button onClick={() => navigate('/pagos')} variant="secondary" className="w-full justify-start">
                💳 Mis Facturas y Pagos
              </Button>
            </div>
          </Card>
          
          <Card title="Billetera TAI" subtitle="Estado de cuenta virtual">
             <div className="bg-gradient-to-r from-ucab-blue to-ucab-green p-6 rounded-xl text-white mt-4">
                <p className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-1">Saldo Disponible</p>
                {/* Se reemplaza el "$0.00 USD" estático por el saldo real del usuario */}
                <p className="text-3xl font-black">${Number(user?.saldo || 0).toFixed(2)} USD</p>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;