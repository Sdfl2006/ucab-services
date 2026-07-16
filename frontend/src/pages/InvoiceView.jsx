import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TASA_BCV } from '../services/mockData';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function InvoiceView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('ucab_last_invoice');
    if (saved) {
      setFactura(JSON.parse(saved));
    } else {
      // Factura fallback de demostración
      setFactura({
        id: 'SOL-2026-9978',
        nroTransaccion: '9978',
        nroControl: '00-847291',
        servicio: 'ALQUILER DE CANCHA DE FUTBOL',
        categoria: 'Deportes',
        sede: user?.sede || 'Montalbán',
        fechaEjecucion: '15 DE MAYO, 4:00PM',
        fechaEmision: '15 de mayo de 2026, 10:30 AM',
        montoUsd: 20.00,
        montoBs: 20.00 * TASA_BCV,
        metodoPago: 'PAGO MOVIL',
        referencia: '12344567',
        estatusFactura: 'PAGADA',
      });
    }
  }, [user]);

  if (!factura) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-6">
      
      {/* TARJETA DE COM PROBANTE DE ÉXITO (Replicando milimétricamente Figura 6 del PDF) */}
      <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500/30 shadow-xl text-center relative overflow-hidden">
        
        {/* Círculo decorativo superior */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner animate-bounce">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Encabezados Figura 6 */}
        <span className="text-xs font-black tracking-widest text-gray-400 uppercase">UCAB-Services</span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">Pago confirmado</h1>
        <p className="text-base font-bold text-ucab-green mt-1">Pago realizado con exito</p>
        
        <div className="mt-3 inline-block bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
          <span className="text-sm font-extrabold text-gray-800">NÚMERO DE TRANSACCIÓN ({factura.nroTransaccion})</span>
        </div>

        {/* DESGLOSE FORMAL DE LA FACTURA INSTITUCIONAL (Valor agregado técnico ERE) */}
        <div className="mt-8 pt-6 border-t border-dashed border-gray-200 text-left space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">FACTURA FISCAL INSTITUCIONAL</p>
              <p className="text-sm font-black text-ucab-green">Nro. Control: {factura.nroControl}</p>
            </div>
            <Badge label={factura.estatusFactura} status="success" size="md" />
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200/60 text-xs">
            <div>
              <span className="text-gray-400 font-semibold block">EMISOR:</span>
              <p className="font-bold text-gray-800">Universidad Católica Andrés Bello</p>
              <p className="text-gray-600">RIF: J-00012255-5</p>
              <p className="text-gray-600">Sede {factura.sede}</p>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block">CLIENTE / SOLICITANTE:</span>
              <p className="font-bold text-gray-800">{user?.nombreCompleto || 'Estudiante UCAB'}</p>
              <p className="text-gray-600">Cédula: {user?.cedula || 'V-31229670'}</p>
              <p className="text-gray-600">{user?.correo}</p>
            </div>
          </div>

          {/* Tabla de Conceptos / Líneas de Cargo */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 flex justify-between">
              <span>DESCRIPCIÓN DEL TRÁMITE / SERVICIO</span>
              <span>IMPORTE</span>
            </div>
            <div className="p-4 bg-white flex justify-between items-center font-medium text-gray-800">
              <div>
                <p className="font-bold text-sm uppercase">{factura.servicio}</p>
                <p className="text-gray-500">Programado para: {factura.fechaEjecucion}</p>
                <p className="text-gray-500">Método: {factura.metodoPago} (Ref: {factura.referencia})</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-base text-gray-900">${factura.montoUsd.toFixed(2)}</p>
                <p className="text-gray-500">Bs. {factura.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex justify-between items-center font-bold text-sm text-ucab-green">
              <span>TOTAL PAGADO (EXENTO IVA):</span>
              <span>${factura.montoUsd.toFixed(2)} USD</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center italic">
            Esta factura digital es un comprobante legal emitido en la plataforma UCAB-Services el {factura.fechaEmision}.
          </p>
        </div>

        {/* BOTONES DE ACCIÓN (Referencia Figura 6: "Volver al inicio") */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.print()}
            className="w-full sm:w-auto font-semibold"
          >
            🖨️ Imprimir / Guardar PDF
          </Button>
          
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto font-black shadow-lg px-8"
          >
            Volver al inicio
          </Button>
        </div>

      </div>

    </div>
  );
}