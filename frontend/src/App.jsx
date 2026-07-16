import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Páginas actuales
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyRequests from './pages/MyRequests';
import MedicalDirectory from './pages/MedicalDirectory';
import ServiceRequest from './pages/ServiceRequest';
import Checkout from './pages/Checkout';
import InvoiceView from './pages/InvoiceView';
import PaymentsHistory from './pages/PaymentsHistory';
import Profile from './pages/Profile';

// Placeholders temporales para las rutas de la Fase 4 y 5
const PlaceholderView = ({ title }) => (
  <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
    <h2 className="text-xl font-bold text-ucab-green">{title}</h2>
    <p className="text-sm text-gray-500 mt-2">Este módulo será construido en nuestro siguiente sprint del plan.</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/solicitudes" element={<MyRequests />} />
          <Route path="/directorio-medico" element={<MedicalDirectory />} />
          <Route path="/solicitudes/nueva" element={<ServiceRequest />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/factura/comprobante" element={<InvoiceView />} />
          <Route path="/pagos" element={<PaymentsHistory />} />
          <Route path="/perfil" element={<Profile />} />

          {/* Rutas Protegidas dentro del Layout Institucional */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Estas rutas las llenaremos con código real en la Fase 4 y 5 */}
            <Route path="/mis-citas" element={<PlaceholderView title="Mis Citas Médicas y Académicas" />} />
            <Route path="/pagos" element={<PlaceholderView title="Historial de Pagos y Billetera TAI" />} />
            <Route path="/soporte" element={<PlaceholderView title="Mesa de Ayuda y Soporte TI" />} />
            <Route path="/solicitudes" element={<PlaceholderView title="Historial y Estatus de Solicitudes" />} />
            <Route path="/solicitudes/nueva" element={<PlaceholderView title="Crear Nueva Solicitud de Servicio" />} />
            <Route path="/directorio-medico" element={<PlaceholderView title="Directorio Médico UCAB" />} />
            <Route path="/eventos" element={<PlaceholderView title="Agenda de Eventos y Cultura" />} />
            <Route path="/perfil" element={<PlaceholderView title="Mi Ficha Institucional" />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}