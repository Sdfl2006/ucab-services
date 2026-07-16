import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-4">
      
      {/* Banner Superior Institucional */}
      <div className="bg-gradient-to-r from-ucab-green via-ucab-green-light to-ucab-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-3xl sm:text-4xl font-black text-ucab-yellow shadow-inner shrink-0">
            {user?.nombres?.[0] || 'U'}{user?.apellidos?.[0] || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge label={user?.rol || 'Estudiante'} className="bg-ucab-yellow text-ucab-blue font-extrabold border-none" size="sm" />
              <Badge label={`Sede ${user?.sede || 'Montalbán'}`} className="bg-white/20 text-white border-white/30" size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.nombreCompleto || 'Jimena Martínez'}</h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-mono">{user?.correo || 'hola@sitioincreible.com'}</p>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 text-center sm:text-right shrink-0 w-full sm:w-auto z-10">
          <span className="text-[11px] text-emerald-200 uppercase tracking-widest block font-semibold">Cédula de Identidad</span>
          <span className="text-lg font-mono font-bold text-white block mt-0.5">{user?.cedula || 'V-31229670'}</span>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center sm:justify-end gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-100">Cuenta: <b>{user?.estadoCuenta?.toUpperCase() || 'ACTIVA'}</b></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Datos Personales (HU-01) */}
        <div className="md:col-span-7 space-y-6">
          <Card title="Datos Personales y de Contacto" subtitle="Información registrada en su ficha institucional (HU-01)">
            <div className="space-y-4 text-sm divide-y divide-gray-100">
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">NOMBRES:</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{user?.nombres || 'Jimena'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">APELLIDOS:</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{user?.apellidos || 'Martínez'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">TELÉFONO MÓVIL:</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{user?.telefono || '0414-1234567'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">LEALTAD / FIDELIDAD:</span>
                  <p className="font-semibold text-ucab-green mt-0.5">{user?.categoriaFidelidad || 'Frecuente'}</p>
                </div>
              </div>

              <div className="pt-3">
                <span className="text-xs font-bold text-gray-400 uppercase block">DIRECCIÓN DE HABITACIÓN:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{user?.direccion || 'Av. Teherán, Montalbán II, Caracas'}</p>
              </div>

              <div className="pt-3">
                <span className="text-xs font-bold text-gray-400 uppercase block">ÚLTIMA CONEXIÓN AL SISTEMA (HU-04):</span>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{new Date(user?.ultimaConexion || Date.now()).toLocaleString('es-VE')}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => alert('Para modificar sus datos personales sensibles, acuda a la Secretaría Académica de su sede.')}>
                Solicitar Actualización de Datos
              </Button>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Trayectoria Institucional (HU-05 y HU-06) + Billetera TAI */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Billetera TAI / NFC */}
          <Card title="Tarjeta Académica (TAI)" subtitle="Tecnología NFC para acceso en Campus">
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block tracking-widest">UCAB SMART CARD</span>
                  <span className="text-xs font-bold text-ucab-yellow block mt-0.5">CHIP NFC ACTIVO</span>
                </div>
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 block">UID CHIP INTERNO:</span>
                <span className="font-mono text-sm tracking-widest text-emerald-300">8F-9A-2B-4C-99-01</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-gray-300">Estatus: <b className="text-emerald-400">Vigente</b></span>
                <span className="font-mono text-white/80">Sede {user?.sede || 'Montalbán'}</span>
              </div>
            </div>
          </Card>

          {/* Trayectoria Institucional y Atributos de Rol (HU-05 / HU-06) */}
          <Card title="Trayectoria Institucional" subtitle="Historial de vinculaciones (HU-05)">
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-ucab-green/5 border border-ucab-green/20 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-ucab-green uppercase text-sm">{user?.rol || 'Estudiante'} (Activo)</span>
                  <Badge label="Vigente" status="success" size="sm" />
                </div>
                <p className="text-gray-600">Periodo: <b>2024-10 - Presente</b></p>
                <p className="text-gray-500 mt-1">
                  {user?.rol === 'Profesor' ? '• Escalafón: Asistente | Carga: 12 hrs/sem' : '• Facultad: Ciencias Económicas y Sociales | Semestre: 6to'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 opacity-80">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-700 uppercase">Estudiante Pregrado</span>
                  <Badge label="Finalizado" status="default" size="sm" />
                </div>
                <p className="text-gray-600">Periodo: <b>2022-09 a 2024-07</b></p>
                <p className="text-gray-500 mt-1">• Ciclo Básico General - Aprobado</p>
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}