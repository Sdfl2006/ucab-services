import api from './api';

export const infrastructureService = {
  getEspacios: async () => {
    const response = await api.get('/infraestructura/espacios');
    return response.data?.data || response.data;
  },
  
  createEspacio: async (data) => {
    const response = await api.post('/infraestructura/espacios', data);
    return response.data;
  },

  updateEstadoEspacio: async (nroIdentificador, en_mantenimiento) => {
    // El backend espera un booleano "en_mantenimiento"
    const response = await api.put(`/infraestructura/espacios/${nroIdentificador}/mantenimiento`, { 
      en_mantenimiento 
    });
    return response.data;
  }
};