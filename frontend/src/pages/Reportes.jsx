import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import DataTable from '../components/table/DataTable';
import Button from '../components/common/Button';

const REPORTES_DISPONIBLES = [
  { id: 'ingresos', nombre: 'Ingresos Consolidados', fetcher: reportService.getIngresos },
  { id: 'cuellos', nombre: 'Tiempos y Cuellos de Botella', fetcher: reportService.getCuellosBotella },
  { id: 'ocupacion', nombre: 'Ocupación de Espacios', fetcher: reportService.getOcupacionEspacios },
  { id: 'seguridad', nombre: 'Auditoría de Seguridad', fetcher: reportService.getSeguridadCuentas },
  { id: 'conciliacion', nombre: 'Conciliación Diaria', fetcher: async () => {
      const res = await reportService.getConciliacionPagos();
      return res.data?.resumen_diario || []; 
    } 
  }
];

export default function Reportes() {
  const { hasAnyRole } = useAuth();
  const [reporteActivo, setReporteActivo] = useState(REPORTES_DISPONIBLES[0]);
  const [datos, setDatos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!hasAnyRole('Admin', 'Personal_Administrativo')) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const cargarReporte = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const respuesta = await reporteActivo.fetcher();
        // Dependiendo de cómo envuelve el backend, extraemos el array
        const dataArray = respuesta?.data || respuesta || [];
        setDatos(Array.isArray(dataArray) ? dataArray : []);
      } catch (err) {
        setError(err.friendlyMessage || 'Error al cargar el reporte desde la base de datos.');
        setDatos([]);
      } finally {
        setIsLoading(false);
      }
    };
    cargarReporte();
  }, [reporteActivo]);

  // Generador dinámico de columnas basado en las llaves del primer objeto
  const generarColumnas = () => {
    if (datos.length === 0) return [];
    return Object.keys(datos[0]).map((key) => ({
      key: key,
      label: key.replace(/_/g, ' ').toUpperCase(),
      sortable: true,
      render: (row) => {
        const valor = row[key];
        // Formateo visual para booleanos o nulos
        if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
        if (valor === null || valor === undefined) return '-';
        return <span className="text-gray-700">{valor}</span>;
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ucab-green">Reportes e Inteligencia de Negocios</h1>
        <p className="text-sm text-gray-500 mt-1">Análisis predictivo y correctivo de operaciones (Módulo Gerencial).</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {REPORTES_DISPONIBLES.map((rep) => (
          <Button
            key={rep.id}
            variant={reporteActivo.id === rep.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setReporteActivo(rep)}
            className="shadow-sm"
          >
            {rep.nombre}
          </Button>
        ))}
      </div>

      <Card title={`Reporte: ${reporteActivo.nombre}`}>
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 animate-pulse">
            Ejecutando consultas analíticas en PostgreSQL...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
            {error}
          </div>
        ) : datos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay datos suficientes para generar este reporte.
          </div>
        ) : (
          <DataTable
            columns={generarColumnas()}
            data={datos}
            searchableColumns={Object.keys(datos[0])}
            initialPageSize={10}
          />
        )}
      </Card>
    </div>
  );
}