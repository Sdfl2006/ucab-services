import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function PaymentsHistory() {
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
          fecha: invoice.fecha_emision ? new Date(invoice.fecha_emision).toLocaleDateString('es-VE') : '',
          metodo: invoice.metodo || invoice.metodo_pago || 'N/A',
          ref: invoice.referencia || invoice.nro_control || 'N/A',
          montoUsd: Number(invoice.monto_usd ?? invoice.saldo ?? 0),
          estatus: invoice.estatus || 'PENDIENTE',
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
      label: 'Importe Total',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-black text-gray-900">${row.montoUsd.toFixed(2)} USD</p>
          <p className="text-[11px] text-gray-500">Bs. {(row.montoUsd * 1).toLocaleString('es-VE')}</p>
        </div>
      ),
    },
    {
      key: 'estatus',
      label: 'Estado Fiscal',
      sortable: true,
      render: (row) => <Badge label={row.estatus} status={row.estatus === 'PAGADA' ? 'success' : 'warning'} size="sm" />, 
    },
    {
      key: 'acciones',
      label: 'Comprobante',
      sortable: false,
      render: () => (
        <Button size="sm" variant="secondary" onClick={() => navigate('/factura/comprobante')}>
          Ver Factura
        </Button>
      ),
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
            <span className="text-2xl font-black text-white">$45.00 USD</span>
            <p className="text-[10px] text-emerald-200">~ Bs. {Math.round(45 * 1).toLocaleString('es-VE')}</p>
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
