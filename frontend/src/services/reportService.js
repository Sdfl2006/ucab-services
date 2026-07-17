import api from './api';

export const reportService = {
  getSeguridadCuentas: async () => {
    const response = await api.get('/reports/seguridad'); 
    return response.data;
  },
  getOcupacionEspacios: async () => {
    const response = await api.get('/reports/ocupacion-espacios'); 
    return response.data;
  },
  getCuellosBotella: async () => {
    const response = await api.get('/reports/tiempos-respuesta'); 
    return response.data;
  },
  getIngresos: async () => {
    const response = await api.get('/reports/ingresos-consolidados'); 
    return response.data;
  },
  getConciliacionPagos: async () => {
    const response = await api.get('/reports/conciliacion-diaria'); 
    return response.data;
  }
};