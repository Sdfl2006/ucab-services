import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import beneficiaryService from '../services/beneficiaryService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';

export default function GestionBeneficiarios() {
  const { hasAnyRole } = useAuth();
  const [beneficiariosList, setBeneficiariosList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Protección de ruta
  if (!hasAnyRole('Admin', 'Personal_Administrativo')) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const adminData = await beneficiaryService.listarBeneficiariosAdmin();
        setBeneficiariosList(adminData.data || []);
      } catch (err) {
        setError(err.friendlyMessage || 'No se pudieron cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const columnas = [
    { key: 'titular', label: 'C.I. Titular', sortable: true, render: (row) => <span className="font-mono text-gray-500">{row.cedula_titular}</span> },
    { key: 'nombres', label: 'Beneficiario', sortable: true, render: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.nombres} {row.apellidos}</p>
          <span className="text-[11px] text-gray-500 font-mono">CI: {row.cedula_beneficiario}</span>
        </div>
      )
    },
    { key: 'parentesco', label: 'Parentesco', sortable: true, render: (row) => <span className="capitalize text-gray-700">{row.parentesco}</span> },
    { key: 'tipo_carga', label: 'Tipo de Carga', sortable: true, render: (row) => <span className="text-gray-700 font-medium">{row.tipo_carga?.replace('_', ' ')}</span> },
    { key: 'beneficios_activos', label: 'Estado', sortable: true, render: (row) => (
        <Badge label={row.beneficios_activos ? 'Activos' : 'Inactivos'} status={row.beneficios_activos ? 'success' : 'warning'} size="sm" />
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
      <h1 className="text-2xl font-black text-ucab-green mb-1">Directorio de Beneficiarios</h1>
      <p className="text-sm text-gray-500 mb-6">Control administrativo general de cargas familiares y coberturas activas.</p>
      
      <Card>
        {isLoading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Cargando directorio...</p>
        ) : error ? (
          <p className="text-sm text-red-600 p-4 bg-red-50 rounded-lg">{error}</p>
        ) : (
          <DataTable
            columns={columnas}
            data={beneficiariosList}
            searchableColumns={['nombres', 'apellidos', 'cedula_beneficiario', 'cedula_titular']}
            initialPageSize={10}
            emptyMessage="No hay beneficiarios registrados en el sistema."
          />
        )}
      </Card>
    </div>
  );
}