import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import paymentService, { METODOS_TAQUILLA } from '../services/paymentService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import { TASA_BCV } from '../services/mockData';

// Contrato real (paymentController.js): estos 4 métodos son exclusivos de
// caja (authorizeRoles('Admin','Personal_Administrativo') en el backend).
// Zelle y Criptomoneda son self-service del usuario (Checkout), no van aquí.
const OPCIONES_METODO = [
  { valor: METODOS_TAQUILLA.TARJETA, etiqueta: 'Tarjeta', icon: '💳' },
  { valor: METODOS_TAQUILLA.PAGO_MOVIL, etiqueta: 'Pago Móvil', icon: '📱' },
  { valor: METODOS_TAQUILLA.EFECTIVO, etiqueta: 'Efectivo', icon: '💵' },
  { valor: METODOS_TAQUILLA.TAI, etiqueta: 'Billetera TAI (NFC)', icon: '🪪' },
];

const CAMPOS_POR_METODO = {
  [METODOS_TAQUILLA.TARJETA]: [
    { name: 'nro_tarjeta', label: 'Número de tarjeta', type: 'text' },
    { name: 'fecha_vencimiento', label: 'Vencimiento', type: 'month' },
    { name: 'compania_emisora', label: 'Compañía emisora', type: 'text', placeholder: 'Visa, Mastercard...' },
    { name: 'tipo_red', label: 'Tipo de red', type: 'select', options: ['Nacional', 'Internacional'] },
  ],
  [METODOS_TAQUILLA.PAGO_MOVIL]: [
    { name: 'nro_telefono', label: 'Teléfono emisor', type: 'tel', placeholder: '0414-1234567' },
    { name: 'banco_origen', label: 'Banco de origen', type: 'text' },
    { name: 'nro_referencia', label: 'N.º de referencia', type: 'text' },
  ],
  [METODOS_TAQUILLA.EFECTIVO]: [
    { name: 'moneda_curso', label: 'Moneda', type: 'select', options: ['bolívares', 'divisas'] },
    { name: 'monto_recibido', label: 'Monto recibido', type: 'number' },
    { name: 'desgloce_denominaciones', label: 'Desglose de denominaciones', type: 'text', placeholder: 'Ej: 2x100 + 5x20' },
  ],
  [METODOS_TAQUILLA.TAI]: [
    { name: 'uid_chip', label: 'UID del chip NFC', type: 'text', placeholder: '8F-9A-2B-4C-99-01' },
    { name: 'codigo_terminal_pos', label: 'Terminal POS', type: 'text' },
  ],
};

const SERVICIO_POR_METODO = {
  [METODOS_TAQUILLA.TARJETA]: (payload) => paymentService.pagarTarjeta(payload),
  [METODOS_TAQUILLA.PAGO_MOVIL]: (payload) => paymentService.pagarPagoMovil(payload),
  [METODOS_TAQUILLA.EFECTIVO]: (payload) => paymentService.pagarEfectivo(payload),
  [METODOS_TAQUILLA.TAI]: (payload) => paymentService.pagarTAI(payload),
};

function valoresIniciales(metodo) {
  return (CAMPOS_POR_METODO[metodo] || []).reduce((acc, c) => ({ ...acc, [c.name]: '' }), {});
}

function CampoDinamico({ campo, valor, onChange }) {
  if (campo.type === 'select') {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{campo.label}</label>
        <select
          value={valor}
          onChange={(e) => onChange(campo.name, e.target.value)}
          required
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green"
        >
          <option value="" disabled>Seleccionar…</option>
          {campo.options.map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
      </div>
    );
  }
  return (
    <Input
      label={campo.label}
      type={campo.type}
      placeholder={campo.placeholder}
      value={valor}
      onChange={(e) => onChange(campo.name, e.target.value)}
      required
    />
  );
}

export default function Taquilla() {
  const { hasAnyRole } = useAuth();

  // --- ESTADOS PARA AUDITORÍA TAI ---
  const [recargas, setRecargas] = useState([]);
  const [cargandoRecargas, setCargandoRecargas] = useState(false);

  // --- ESTADOS PARA COBRO DE FACTURAS ---
  const [nroControlFactura, setNroControlFactura] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState(METODOS_TAQUILLA.TARJETA);
  const [datosMetodo, setDatosMetodo] = useState(() => valoresIniciales(METODOS_TAQUILLA.TARJETA));
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  // Cargar las recargas pendientes al iniciar si tiene el rol
  useEffect(() => {
    if (hasAnyRole('Admin', 'Personal_Administrativo')) {
      cargarRecargasPendientes();
    }
  }, [hasAnyRole]);

  const cargarRecargasPendientes = async () => {
    setCargandoRecargas(true);
    try {
      const data = await paymentService.getRecargasPendientes();
      setRecargas(data || []);
    } catch (error) {
      console.error("Error cargando recargas:", error);
    } finally {
      setCargandoRecargas(false);
    }
  };

  const handleAprobarRecarga = async (idMovimiento, solicitante) => {
    const confirmar = window.confirm(`¿Confirmas que la transferencia de ${solicitante} ya está reflejada en la cuenta del banco de la universidad?`);
    if (!confirmar) return;
    
    try {
      await paymentService.aprobarRecarga(idMovimiento);
      alert('Recarga aprobada exitosamente. El saldo virtual ha sido liberado.');
      cargarRecargasPendientes(); // Refrescar la tabla
    } catch (error) {
      alert('Error al aprobar: ' + (error?.friendlyMessage || error?.message));
    }
  };

  // Redirección de seguridad
  if (!hasAnyRole('Admin', 'Personal_Administrativo')) {
    return <Navigate to="/dashboard" replace />;
  }

  const campos = CAMPOS_POR_METODO[metodo] || [];

  function handleCambiarMetodo(nuevoMetodo) {
    setMetodo(nuevoMetodo);
    setDatosMetodo(valoresIniciales(nuevoMetodo));
    setError(null);
    setResultado(null);
  }

  const esMonedaNacional = metodo === METODOS_TAQUILLA.PAGO_MOVIL || (metodo === METODOS_TAQUILLA.EFECTIVO && datosMetodo.moneda_curso === 'bolívares');
  
  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setResultado(null);

    try {
      const ejecutar = SERVICIO_POR_METODO[metodo];
      
      let montoBaseDatos = Number(monto);
      if (esMonedaNacional) {
        montoBaseDatos = montoBaseDatos / TASA_BCV;
      }

      const pago = await ejecutar({
        nro_control_factura: nroControlFactura,
        monto: Number(montoBaseDatos.toFixed(2)), 
        ...datosMetodo,
      });

      setResultado(pago);
      setMonto('');
      setDatosMetodo(valoresIniciales(metodo));
    } catch (err) {
      setError(err.friendlyMessage || 'No se pudo procesar el pago.');
    } finally {
      setEnviando(false);
    }
  }

  // --- COLUMNAS DE LA TABLA TAI ---
  const columnasRecargas = [
    { 
      key: 'solicitante', 
      label: 'Estudiante', 
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.solicitante}</p>
          <span className="text-[11px] text-gray-500 font-mono">CI: {row.cedula_miembro}</span>
        </div>
      )
    },
    { 
      key: 'referencia_bancaria', 
      label: 'Origen y Referencia',
      render: (row) => (
        <div className="flex flex-col">
           <span className="font-bold text-xs text-gray-800 uppercase">{row.metodo_fondeo || 'Desconocido'}</span>
           <span className="font-mono text-xs text-gray-500">Ref: {row.referencia_bancaria}</span>
        </div>
      )
    },
    { 
      key: 'monto', 
      label: 'Monto a Fondear', 
      sortable: true,
      render: (row) => <span className="font-black text-green-700">${Number(row.monto).toFixed(2)} USD</span>
    },
    { 
      key: 'fecha_hora', 
      label: 'Fecha', 
      sortable: true,
      render: (row) => <span className="text-xs text-gray-600">{new Date(row.fecha_hora).toLocaleString('es-VE')}</span>
    },
    { 
      key: 'estatus', 
      label: 'Estatus',
      render: () => <Badge label="EN REVISIÓN" status="warning" size="sm" />
    },
    { 
      key: 'acciones', 
      label: 'Auditoría', 
      sortable: false,
      render: (row) => (
        <Button 
          size="sm" 
          variant="primary" 
          onClick={() => handleAprobarRecarga(row.id_movimiento, row.solicitante)}
        >
          Aprobar
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ucab-green">Caja y Taquilla</h1>
        <p className="text-sm text-gray-500 mt-1">Módulo unificado de gestión de cobros presenciales y auditoría de transferencias.</p>
      </div>

      {/* SECCIÓN 1: Auditoría de Recargas TAI */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Auditoría de Recargas TAI</h2>
            <p className="text-xs text-gray-500 mt-1">Valide las transferencias enviadas por los estudiantes antes de liberar su saldo virtual.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={cargarRecargasPendientes} loading={cargandoRecargas}>
            ↻ Refrescar Lista
          </Button>
        </div>

        {cargandoRecargas ? (
          <div className="p-6 bg-gray-50 text-center text-sm font-medium text-gray-500 rounded-xl border border-gray-100">
            Buscando solicitudes pendientes...
          </div>
        ) : (
          <DataTable
            columns={columnasRecargas}
            data={recargas}
            searchableColumns={['solicitante', 'cedula_miembro', 'referencia_bancaria']}
            initialPageSize={5}
            emptyMessage="No hay recargas pendientes por auditar en este momento."
          />
        )}
      </Card>

      {/* SECCIÓN 2: Procesamiento de Facturas Presenciales (Original) */}
      <Card>
        <div className="mb-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Procesar Factura Presencial</h2>
          <p className="text-xs text-gray-500 mt-1">Registra la liquidación de una deuda utilizando el método de pago presentado en la taquilla.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="N.º de control de factura"
              value={nroControlFactura}
              onChange={(e) => setNroControlFactura(e.target.value)}
              required
            />
            <Input
              label={`Monto a liquidar (${esMonedaNacional ? 'Bs.' : 'USD'})`}
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              helperText={monto ? `Equivale a amortizar: ${esMonedaNacional ? '$' + (Number(monto) / TASA_BCV).toFixed(2) : 'Bs. ' + (Number(monto) * TASA_BCV).toLocaleString('es-VE')}` : 'Monto exacto recibido en taquilla'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Método de pago</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OPCIONES_METODO.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => handleCambiarMetodo(op.valor)}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    metodo === op.valor
                      ? 'bg-ucab-green text-white border-ucab-green shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{op.icon}</span>
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            {campos.map((campo) => (
              <CampoDinamico
                key={campo.name}
                campo={campo}
                valor={datosMetodo[campo.name] ?? ''}
                onChange={(name, value) => setDatosMetodo((prev) => ({ ...prev, [name]: value }))}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
              ⚠️ {error}
            </div>
          )}
          {resultado && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
              ✓ Pago registrado. Saldo de la factura: {resultado.factura_actualizada?.saldo} — Estatus: {resultado.factura_actualizada?.estatus}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={enviando} className="w-full font-bold">
            Procesar pago
          </Button>
        </form>
      </Card>
    </div>
  );
}