import React, { useState, useMemo } from 'react';

export default function DataTable({
  columns = [],
  data = [],
  searchableColumns = [],
  initialPageSize = 5,
  emptyMessage = "No se encontraron registros disponibles."
}) {
  // Estados para Búsqueda, Ordenamiento y Paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 1. Filtrado de datos en tiempo real (Búsqueda)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lowerSearch = searchTerm.toLowerCase();

    return data.filter((item) => {
      // Si se especifican columnas, busca solo en ellas; si no, busca en todas las propiedades del objeto
      const keysToSearch = searchableColumns.length > 0 ? searchableColumns : Object.keys(item);
      return keysToSearch.some((key) => {
        const val = item[key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, searchableColumns]);

  // 2. Ordenamiento de columnas (Sorting)
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Paginación de registros
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Manejador del clic en encabezado para ordenar
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reiniciar a la página 1 al ordenar
  };

  // Manejador del cambio de tamaño de página
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Barra de controles superiores: Búsqueda y Selector de Paginación */}
      <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar registro..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green transition-all"
          />
        </div>

        {/* Selector de Tamaño de Página */}
        <div className="flex items-center gap-2 text-sm text-gray-600 self-end sm:self-auto">
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>por pág.</span>
        </div>
      </div>

      {/* Contenedor responsivo de la Tabla */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ucab-green text-white text-xs uppercase tracking-wider font-semibold">
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  onClick={() => col.sortable !== false && col.key && handleSort(col.key)}
                  className={`px-6 py-3.5 select-none ${
                    col.sortable !== false && col.key ? 'cursor-pointer hover:bg-ucab-green-dark transition-colors' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5 justify-between">
                    <span>{col.label}</span>
                    {col.sortable !== false && col.key && (
                      <span className="inline-flex flex-col text-[10px] leading-none opacity-80">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? '▲' : '▼'
                        ) : (
                          <span className="opacity-30">▲▼</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-gray-50/80 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de Tabla: Controles de Paginación */}
      <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <div>
          Mostrando <span className="font-semibold text-gray-800">{sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a{' '}
          <span className="font-semibold text-gray-800">{Math.min(currentPage * pageSize, sortedData.length)}</span> de{' '}
          <span className="font-semibold text-gray-800">{sortedData.length}</span> registros
        </div>

        <div className="flex items-center gap-1">
          {/* Botón Anterior */}
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
          >
            Anterior
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Lógica simple para no saturar si hay muchas páginas
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded flex items-center justify-center font-semibold transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-ucab-green text-white border border-ucab-green'
                        : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-1 text-gray-400">...</span>;
              }
              return null;
            })}
          </div>

          {/* Botón Siguiente */}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || sortedData.length === 0}
            className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}