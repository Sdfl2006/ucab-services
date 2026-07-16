import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TASA_BCV } from '../services/mockData';
import DataTable from '../components/table/DataTable';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function PaymentsHistory() {
  const navigate = useNavigate();

  // Mocks de facturas pagadas y saldo TAI
  const [pagos] = useState([
    { id: 'FAC-001', nroControl: '00-847291', servicio: 'ALQUILER DE CANCHA DE FUTBOL', fecha: '2026-05-15', metodo: 'PAGO MOVIL', ref: '12344567', montoUsd: 20.00, estatus: 'PAGADA' },
    { id: 'FAC-002', nroControl: '00-847102', servicio: 'REPOSICION DE CARNET / TAI NFC', fecha: '2026-04-20', metodo: 'ZELLE', ref: 'TX-99812A', montoUsd: 12.00, estatus: 'PAGADA' },
    { id: 'FAC-003', nroControl: '00-846990', servicio: 'ALQUILER AUDITORIO CONSTANZA VEROLINI', fecha: '2026-04-10', metodo: 'TRANSFERENCIA', ref: '00918273', montoUsd: 80.00, estatus: 'PAGADA' },
    { id: 'FAC-004', nroControl: '00-845512', servicio: 'CONSTANCIA DE ESTUDIOS CERTIFICADA', fecha: '2026-03-22', metodo: 'TAI (NFC)', ref: 'POS-CHIP-01', montoUsd: 10.00, estatus: 'PAGADA' },
    { id: 'FAC-005', nroControl: '00-844109', servicio: 'INSCRIPCION DISCIPLINAS DEPORTIVAS', fecha: '2026-02-15', metodo: 'PAGO MOVIL', ref: '88776655', montoUsd: 15.00, estatus: 'PAGADA' },
  ]);

  const columns = [
    {
      key: 'nroControl',
      label: 'Factura / Control',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-ucab-green">{row.nroControl}</span>
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
      )
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
      )
    },
    {
      key: 'montoUsd',
      label: 'Importe Total',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-black text-gray-900">${row.montoUsd.toFixed(2)} USD</p>
          <p className="text-[11px] text-gray-500">Bs. {(row.montoUsd * TASA_BCV).toLocaleString('es-VE')}</p>
        </div>
      )
    },
    {
      key: 'estatus',
      label: 'Estado Fiscal',
      sortable: true,
      render: (row) => <Badge label={row.estatus} status="success" size="sm" />
    },
    {
      key: 'acciones',
      label: 'Comprobante',
      sortable: false,
      render: () => (
        <Button size="sm" variant="secondary" onClick={() => navigate('/factura/comprobante')}>
          Ver Factura
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Banner de Billetera TAI y Saldo */}
      <div className="bg-gradient-to-r from-gray-900 via-ucab-blue to-ucab-green p-6 sm:p-8 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-ucab-yellow uppercase tracking-widest">Billetera Académica Inteligente (TAI)</span>
          <h1 className="text-2xl sm:text-3xl font-black">Historial de Pagos y Facturación</h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Consulte todas las facturas procesadas y liquidaciones en línea de las sedes Montalbán y Guayana.
          </p>
        </div>

        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between">
          <div>
            <span className="text-xs text-gray-300 font-semibold block">SALDO VIRTUAL TAI:</span>
            <span className="text-2xl font-black text-white">$45.00 USD</span>
            <p className="text-[10px] text-emerald-200">~ Bs. {(45 * TASA_BCV).toLocaleString('es-VE')}</p>
          </div>
          <Button size="sm" variant="accent" onClick={() => alert('Para recargar su Billetera TAI acerque su carnet a las taquillas de caja o transfiera por Zelle/Pago Móvil.')}>
            + Recargar
          </Button>
        </div>
      </div>

      {/* RÚBRICA: Tabla de Historial con Paginación y Filtrado */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
          <span>💡 Filtre por número de control, servicio o método de pago.</span>
          <span>Tasa BCV Referencial: <b>{TASA_BCV} Bs/$</b></span>
        </div>

        <DataTable
          columns={columns}
          data={pagos}
          searchableColumns={['nroControl', 'servicio', 'metodo', 'ref']}
          initialPageSize={5}
          emptyMessage="No se encontraron facturas registradas en su historial."
        />
      </div>

    </div>
  );
}