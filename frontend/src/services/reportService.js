import api from './api';

export const reportService = {
  getSeguridadCuentas: async () => {
    // Cambiamos '/reports' por '/reportes'
    const response = await api.get('/reportes/seguridad'); 
    return response.data;
  },
  getOcupacionEspacios: async () => {
    const response = await api.get('/reportes/ocupacion-espacios'); 
    return response.data;
  },
  getCuellosBotella: async () => {
    const response = await api.get('/reportes/tiempos-respuesta'); 
    return response.data;
  },
  getIngresos: async () => {
    const response = await api.get('/reportes/ingresos-consolidados'); 
    return response.data;
  },
  getConciliacionPagos: async () => {
    const response = await api.get('/reportes/conciliacion-diaria'); 
    return response.data;
  }
};