import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import paymentService from '../services/paymentService';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function PaymentsHistory() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          {/* Mostramos el SALDO restante, no el total original */}
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
                // Si ya pagó, va a ver su comprobante
                navigate(`/factura/comprobante?nroControl=${encodeURIComponent(row.nroControl)}`, { state: { invoice: row } });
              } else {
                // Si debe dinero, armamos el carrito con el SALDO RESTANTE y lo mandamos a pagar
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
      <div className="bg-gradient-to-r from-gray-900 via-ucab-blue to-ucab-green p-6 sm:p-8 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-ucab-yellow uppercase tracking-widest">Billetera Académica Inteligente (TAI)</span>
          <h1 className="text-2xl sm:text-3xl font-black">Historial de Pagos y Facturación</h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Consulte todas las facturas procesadas y liquidaciones en línea.
          </p>
        </div>

        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between">
          <div>
            <span className="text-xs text-gray-300 font-semibold block">SALDO VIRTUAL TAI:</span>
            <span className="text-2xl font-black text-white">${Number(user?.saldo || 0).toFixed(2)} USD</span>
            <p className="text-[10px] text-emerald-200">~ Bs. {Math.round(Number(user?.saldo || 0) * 1).toLocaleString('es-VE')}</p>
          </div>
          <Button size="sm" variant="accent" onClick={() => alert('Para recargar su Billetera TAI acerque su carnet a las taquillas de caja o transfiera por Zelle/Pago Móvil.') }>
            + Recargar
          </Button>
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
