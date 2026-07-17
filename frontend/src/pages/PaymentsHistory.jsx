import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import paymentService from '../services/paymentService';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function PaymentsHistory() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [mostrandoRecarga, setMostrandoRecarga] = useState(false);
  const [datosRecarga, setDatosRecarga] = useState({ monto: '', referencia_bancaria: '', metodo_fondeo: '' });
  const [saldoReal, setSaldoReal] = useState(0); // NUEVO ESTADO

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const saldo = await paymentService.getSaldoTAI();
        setSaldoReal(saldo);
      } catch (error) {
        console.error("No se pudo cargar el saldo TAI");
      }
    };
    fetchSaldo();
  }, []);

  useEffect(() => {
    const cargarPagos = async () => {
      setStatus('loading');
      try {
        const invoices = await paymentService.getInvoices();
        setPagos((invoices || []).map((invoice) => ({
          id: invoice.id || invoice.nro_control || `${invoice.nro_solicitud}`,
          nroControl: invoice.nro_control || invoice.nroControl || 'N/A',
          servicio: invoice.servicio || `Solicitud ${invoice.nro_solicitud || ''}`,
          categoria: invoice.categoria || 'N/A',
          sede: invoice.sede || 'N/A',
          fecha: invoice.fecha_emision ? new Date(invoice.fecha_emision).toLocaleDateString('es-VE') : '',
          metodo: invoice.metodo_pago || invoice.metodo || 'N/A',
          ref: invoice.referencia || invoice.nro_control || 'N/A',
          montoUsd: Number(invoice.saldo ?? invoice.monto_usd ?? 0),
          estatus: invoice.estatus || 'PENDIENTE',
          solicitante: invoice.solicitante,
          cedulaSolicitante: invoice.cedula_solicitante,
          correoSolicitante: invoice.correo_solicitante,
          fechaEmision: invoice.fecha_emision || invoice.fecha,
          referencia: invoice.referencia || invoice.ref || invoice.nro_control || 'N/A',
        })));
        setStatus('success');
      } catch (err) {
        setError(err.friendlyMessage || 'No se pudieron cargar las facturas.');
        setStatus('error');
      }
    };

    cargarPagos();
  }, []);

  const columns = [
    {
      key: 'nroControl',
      label: 'Factura / Control',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-ucab-green">{row.nroControl}</span>,
    },
    {
      key: 'servicio',
      label: 'Servicio / Concepto',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.servicio}</p>
          <span className="text-[11px] text-gray-500">Emitida el: {row.fecha}</span>
        </div>
      ),
    },
    {
      key: 'categoria',
      label: 'Categoría',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-700">{row.categoria}</span>,
    },
    {
      key: 'sede',
      label: 'Sede',
      sortable: true,
      render: (row) => <span className="text-sm text-gray-700">{row.sede}</span>,
    },
    {
      key: 'metodo',
      label: 'Método y Ref',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-xs font-bold text-gray-800">{row.metodo}</span>
          <p className="text-[11px] text-gray-500 font-mono">Ref: {row.ref}</p>
        </div>
      ),
    },
    {
      key: 'montoUsd',
      label: 'Deuda Pendiente',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-black text-gray-900">${Number(row.montoUsd).toFixed(2)} USD</p>
          <p className="text-[11px] text-gray-500">Total servicio: ${(row.montoUsd).toFixed(2)}</p>
        </div>
      ),
    },
    {
      key: 'estatus',
      label: 'Estado Fiscal',
      sortable: true,
      render: (row) => {
        const estado = String(row.estatus || '').toUpperCase();
        return <Badge label={estado} status={estado === 'PAGADA' ? 'success' : 'warning'} size="sm" />;
      },
    },
    {
      key: 'acciones',
      label: 'Acción',
      sortable: false,
      render: (row) => {
        const isPaid = String(row.estatus || '').toUpperCase() === 'PAGADA';
        return (
          <Button
            size="sm"
            variant={isPaid ? 'secondary' : 'primary'}
            onClick={() => {
              if (isPaid) {
                navigate(`/factura/comprobante?nroControl=${encodeURIComponent(row.nroControl)}`, { state: { invoice: row } });
              } else {
                const pendingOrder = {
                  nroControl: row.nroControl,
                  nroSolicitud: row.id,
                  servicio: row.servicio,
                  categoria: row.categoria,
                  sede: row.sede,
                  montoUsd: Number(row.montoUsd), 
                  montoBs: Number(row.montoUsd) * 55.40,
                  fechaCreacion: new Date().toISOString()
                };
                localStorage.setItem('ucab_pending_order', JSON.stringify(pendingOrder));
                navigate('/checkout');
              }
            }}
          >
            {isPaid ? 'Ver Factura' : 'Pagar Saldo'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Contenedor del encabezado */}
      <div className="bg-gradient-to-r from-gray-900 via-ucab-blue to-ucab-green p-6 sm:p-8 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-ucab-yellow uppercase tracking-widest">Billetera Académica Inteligente (TAI)</span>
          <h1 className="text-2xl sm:text-3xl font-black">Historial de Pagos y Facturación</h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Consulte todas las facturas procesadas y liquidaciones en línea.
          </p>
        </div>

        {/* WIDGET DE RECARGA MEJORADO */}
        <div className="bg-black/20 p-5 md:p-6 rounded-2xl border border-white/20 flex flex-col gap-4 shrink-0 w-full sm:w-80 md:w-96 shadow-inner">
          <div className="flex justify-between items-center gap-4">
            <div>
              <span className="text-[10px] text-gray-300 font-bold tracking-wider block mb-1">SALDO VIRTUAL TAI</span>
              <span className="text-3xl font-black text-white leading-none">${Number(saldoReal).toFixed(2)} USD</span>            </div>
            <Button 
              size="sm" 
              variant={mostrandoRecarga ? 'secondary' : 'accent'} 
              onClick={() => setMostrandoRecarga(!mostrandoRecarga)}
            >
              {mostrandoRecarga ? 'Cancelar' : '+ Recargar'}
            </Button>
          </div>
          
          {mostrandoRecarga && (
            <div className="mt-2 pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
              <p className="text-xs text-gray-300 leading-snug">
                Para fondear tu cuenta, realiza una transferencia a las cuentas de la universidad y registra los datos del comprobante aquí.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-300 font-semibold mb-1 block uppercase tracking-wide">
                    Monto Transferido (USD)
                  </label>
                  <input 
                    type="number"
                    placeholder="Ej. 50.00"
                    className="w-full bg-white text-gray-900 border-0 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-ucab-green outline-none font-medium"
                    value={datosRecarga.monto} 
                    onChange={(e) => setDatosRecarga({...datosRecarga, monto: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="text-[11px] text-gray-300 font-semibold mb-1 block uppercase tracking-wide">
                    Nro. de Referencia o TXID
                  </label>
                  <input 
                    type="text"
                    placeholder="Últimos 6 dígitos del voucher"
                    className="w-full bg-white text-gray-900 border-0 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:ring-2 focus:ring-ucab-green outline-none font-medium"
                    value={datosRecarga.referencia_bancaria} 
                    onChange={(e) => setDatosRecarga({...datosRecarga, referencia_bancaria: e.target.value})} 
                  />
                </div>

                {/* AQUÍ VA EL SELECTOR DE MÉTODO DE FONDEO */}
                <div>
                  <label className="text-[11px] text-gray-300 font-semibold mb-1 block uppercase tracking-wide">
                    Método de Transferencia
                  </label>
                  <select 
                    className="w-full bg-white text-gray-900 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ucab-green outline-none font-medium"
                    value={datosRecarga.metodo_fondeo}
                    onChange={(e) => setDatosRecarga({...datosRecarga, metodo_fondeo: e.target.value})}
                  >
                    <option value="" disabled>Seleccione un método...</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Transferencia Nacional">Transferencia Nacional</option>
                  </select>
                </div>

                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full mt-2 font-bold shadow-md"
                  onClick={async () => {
                    // SE ACTUALIZÓ LA VALIDACIÓN PARA INCLUIR EL MÉTODO
                    if (!datosRecarga.monto || !datosRecarga.referencia_bancaria || !datosRecarga.metodo_fondeo) {
                      return alert('Por favor, ingresa el monto, la referencia y el método de pago.');
                    }
                    try {
                      await paymentService.solicitarRecargaTAI(datosRecarga);
                      alert('Recarga enviada. Un cajero la validará pronto.');
                      setMostrandoRecarga(false);
                      // SE LIMPIA TAMBIÉN EL MÉTODO AL TERMINAR
                      setDatosRecarga({ monto: '', referencia_bancaria: '', metodo_fondeo: '' }); 
                    } catch(e) { 
                      alert(e?.friendlyMessage || e?.message || 'Ocurrió un error al solicitar la recarga.'); 
                    }
                  }}
                >
                  Registrar Recarga
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">Cargando historial de pagos…</div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      )}

      {status === 'success' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-500 px-1">
            <span>💡 Filtre por número de control, servicio o método de pago.</span>
            <span>Las facturas se sincronizan desde backend cuando su sesión está activa.</span>
          </div>

          <DataTable
            columns={columns}
            data={pagos}
            searchableColumns={['nroControl', 'servicio', 'metodo', 'ref']}
            initialPageSize={5}
            emptyMessage="No se encontraron facturas registradas en su historial."
          />
        </div>
      )}
    </div>
  );
}