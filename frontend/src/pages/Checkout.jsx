import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TASA_BCV } from '../services/mockData';
import paymentService from '../services/paymentService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [metodoPago, setMetodoPago] = useState('PAGO MOVIL');
  const [referencia, setReferencia] = useState('');
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem('ucab_pending_order');
    if (pending) {
      setOrden(JSON.parse(pending));
    } else {
      setOrden({
        id: 'SOL-2026-9978',
        nroSolicitud: '9978',
        servicio: 'ALQUILER DE CANCHA DE FUTBOL',
        categoria: 'Deportes',
        sede: user?.sede || 'Montalbán',
        fechaEjecucion: '15 DE MAYO, 4:00PM',
        montoUsd: 20.0,
        montoBs: 20.0 * TASA_BCV,
        acompanantes: [{ nombre: 'Carlos Mendoza', cedula: 'V-28900111' }],
      });
    }
  }, [user]);

  const handleFinalizarPago = async (e) => {
    e.preventDefault();
    setError('');

    if (!terminosAceptados) {
      setError('Debe aceptar los términos y condiciones de uso de las instalaciones para continuar.');
      return;
    }

    setIsProcessing(true);
    try {
      let numeroControl = orden.nroControl;

      // 1. Si es una solicitud nueva (no venimos del botón "Pagar Saldo"), generamos la factura
      if (!numeroControl) {
        const invoicePayload = {
          nro_solicitud: orden?.nroSolicitud,
          fecha_apertura: orden?.fechaCreacion, 
          rif_corporativo: 'J-00012255-5',
          razon_social_corporativa: 'Universidad Católica Andrés Bello',
        };
        const resInvoice = await paymentService.generateInvoice(invoicePayload);
        const invoiceData = resInvoice?.data ?? resInvoice;
        numeroControl = invoiceData.nro_control;
      }

      // 2. Registrar el PAGO REAL en backend
      // CORRECCIÓN CLAVE: El backend evalúa la deuda en USD. Pasamos orden.montoUsd
      await paymentService.pagarPagoMovil({
        nro_control_factura: numeroControl,
        monto: orden.montoUsd, // <-- ENVIAMOS EL MONTO EN LA MONEDA BASE
        nro_telefono: '04141234567',
        banco_origen: metodoPago === 'ZELLE' ? 'Zelle / Divisas' : 'Banca en Línea',
        nro_referencia: referencia || '12345678'
      });

      localStorage.removeItem('ucab_pending_order');
      navigate(`/factura/comprobante?nroControl=${numeroControl}`);
    } catch (err) {
      setError(err.friendlyMessage || 'Ocurrió un error al procesar el pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orden) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-ucab-green text-white p-6 rounded-2xl shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Resumen del Pedido</h1>
          <p className="text-xs text-emerald-100 mt-0.5">Verifique los detalles de su servicio y proceda a la liquidación.</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">Paso 2 de 2: Pago</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-shake">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 space-y-4">
          <Card title="Detalle de la Solicitud" subtitle={`Número de Control: #${orden.nroSolicitud}`}>
            <div className="space-y-4 text-sm divide-y divide-gray-100">
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-400 block uppercase">SERVICIO:</span>
                <p className="font-extrabold text-gray-900 text-base mt-0.5 uppercase">{orden.servicio}</p>
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded mt-1 font-medium">
                  {orden.categoria} • Sede {orden.sede}
                </span>
              </div>

              <div className="pt-3">
                <span className="text-xs font-bold text-gray-400 block uppercase">FECHA Y HORA:</span>
                <p className="font-bold text-gray-800 mt-0.5 uppercase">{orden.fechaEjecucion}</p>
              </div>

              {orden.acompanantes && orden.acompanantes.length > 0 && (
                <div className="pt-3">
                  <span className="text-xs font-bold text-gray-400 block uppercase">ACOMPAÑANTES REGISTRADOS:</span>
                  <div className="mt-1 space-y-1">
                    {orden.acompanantes.map((ac, i) => (
                      <p key={i} className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-200/60 font-medium flex justify-between">
                        <span>👤 {ac.nombre}</span>
                        <span className="font-mono text-gray-500">{ac.cedula}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 pb-2">
                <span className="text-xs font-bold text-gray-400 block uppercase">MONTO A PAGAR:</span>
                <div className="flex items-baseline gap-3 mt-1 bg-ucab-green/5 p-3 rounded-xl border border-ucab-green/20">
                  <span className="text-2xl font-black text-ucab-green">${orden.montoUsd.toFixed(2)} USD</span>
                  <span className="text-base font-bold text-gray-700">/ {orden.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} BS</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">Tasa referencial oficial BCV: <b>{TASA_BCV} Bs/$</b>.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={terminosAceptados}
                  onChange={(e) => setTerminosAceptados(e.target.checked)}
                  className="rounded text-ucab-green focus:ring-ucab-green w-4 h-4 mt-0.5 shrink-0"
                />
                <span>
                  Acepto los <Link to="/terminos" target="_blank" className="font-bold text-ucab-green underline">Términos y condiciones</Link> de uso de las instalaciones físicas y normas administrativas.
                </span>
              </label>
            </div>
          </Card>
        </div>

        <div className="md:col-span-5 space-y-4">
          <Card title="Confirmación de pagos" subtitle="Seleccione su método de liquidación">
            <form onSubmit={handleFinalizarPago} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">MÉTODO DE PAGO</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'PAGO MOVIL', label: 'PAGO MÓVIL (Bancos Nacionales)', icon: '📱' },
                    { id: 'ZELLE', label: 'ZELLE / Divisas Electrónicas', icon: '💵' },
                    { id: 'TRANSFERENCIA', label: 'TRANSFERENCIA BANCARIA', icon: '🏦' },
                    { id: 'TAI', label: 'BILLETERA TAI (Chip NFC en Campus)', icon: '💳' },
                  ].map((metodo) => (
                    <button
                      key={metodo.id}
                      type="button"
                      onClick={() => { setMetodoPago(metodo.id); setReferencia(''); }}
                      className={`w-full p-3 rounded-xl border text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                        metodoPago === metodo.id
                          ? 'bg-ucab-green text-white border-ucab-green shadow-md'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{metodo.icon}</span>
                        <span>{metodo.label}</span>
                      </span>
                      {metodoPago === metodo.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                {metodoPago === 'PAGO MOVIL' && (
                  <>
                    <p className="font-bold text-gray-800">Datos para Pago Móvil UCAB:</p>
                    <p>• <b>Banco:</b> Mercantil (0105) o BNC (0191)</p>
                    <p>• <b>Teléfono:</b> 0414-1234567 | <b>RIF:</b> J-00012255-5</p>
                    <p>• <b>Monto exacto:</b> {orden.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                  </>
                )}
                {metodoPago === 'ZELLE' && (
                  <>
                    <p className="font-bold text-gray-800">Datos para transferencia Zelle:</p>
                    <p>• <b>Correo:</b> cobranzas@ucab.edu.ve</p>
                    <p>• <b>Titular:</b> Universidad Católica Andrés Bello</p>
                    <p>• <b>Monto exacto:</b> ${orden.montoUsd.toFixed(2)} USD</p>
                  </>
                )}
                {metodoPago === 'TRANSFERENCIA' && (
                  <>
                    <p className="font-bold text-gray-800">Cuentas Corrientes UCAB:</p>
                    <p>• <b>Banco Nacional de Crédito (BNC):</b> 0191-0001-23-4567890001</p>
                    <p>• <b>RIF:</b> J-00012255-5 | <b>Tipo:</b> Corriente</p>
                  </>
                )}
                {metodoPago === 'TAI' && (
                  <>
                    <p className="font-bold text-ucab-green">Aproximación de Carnet Inteligente (NFC):</p>
                    <p>Al pulsar finalizar, el sistema simulará la lectura del chip UID de su carnet para descontar el saldo directamente de su Billetera Virtual TAI.</p>
                  </>
                )}
              </div>

              {metodoPago !== 'TAI' ? (
                <div>
                  <Input
                    label="NÚMERO DE REFERENCIA DE PAGO:"
                    id="ref"
                    placeholder="Ej: 12344567 o TXID confirmación"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    required
                    helperText="Ingrese los últimos 6 u 8 dígitos de su comprobante."
                  />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center text-xs text-amber-800 font-bold">
                  ⚡ Listo para cobro instantáneo por Taquilla / POS Campus
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" loading={isProcessing} variant="primary" size="lg" className="w-full">
                  Finalizar Pago
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
