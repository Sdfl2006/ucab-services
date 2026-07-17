import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

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
import SeguimientoSolicitud from './pages/SeguimientoSolicitud';
import Taquilla from './pages/Taquilla';
import GestionInfraestructura from './pages/GestionInfraestructura';
import BolsaTrabajo from './pages/BolsaTrabajo';
import GestionBeneficiarios from './pages/GestionBeneficiarios';

const PlaceholderView = ({ title }) => (
  <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
    <h2 className="text-xl font-bold text-ucab-green">{title}</h2>
    <p className="text-sm text-gray-500 mt-2">Este módulo será construido en nuestro siguiente sprint del plan.</p>
  </div>
);

// NOTA DE AUDITORÍA: la versión anterior de este archivo envolvía todo en
// un <AuthProvider> propio ADEMÁS del que ya está en main.jsx (doble
// provider, el de aquí adentro ganaba y el de main.jsx quedaba muerto), y
// registraba cada página real (MyRequests, ServiceRequest, Checkout,
// InvoiceView, PaymentsHistory, Profile, MedicalDirectory) dos veces: una
// vez pública y sin protección en la raíz, y otra vez dentro de
// <ProtectedRoute> pero apuntando a un <PlaceholderView> inalcanzable por
// la colisión de rutas duplicadas. En la práctica, TODA la aplicación
// quedaba sin autenticación real. Este árbol de rutas es único: cada path
// aparece una sola vez, y todo lo que no sea login/registro vive dentro de
// ProtectedRoute + MainLayout.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/solicitudes" element={<MyRequests />} />
          <Route path="/solicitudes/nueva" element={<ServiceRequest />} />
          <Route path="/solicitudes/:nroSolicitud" element={<SeguimientoSolicitud />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/factura/comprobante" element={<InvoiceView />} />
          <Route path="/pagos" element={<PaymentsHistory />} />
          <Route path="/taquilla" element={<Taquilla />} />
          <Route path="/directorio-medico" element={<MedicalDirectory />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/beneficiarios" element={<GestionBeneficiarios />} />
          <Route path="/infraestructura" element={<GestionInfraestructura />} />
          <Route path="/bolsa-trabajo" element={<BolsaTrabajo />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}