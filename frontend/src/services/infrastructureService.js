import api from './api';

export const infrastructureService = {
  // --- EDIFICACIONES (HU-13) ---
  getEdificaciones: async () => {
    const response = await api.get('/infrastructure/edificaciones');
    return response.data;
  },
  
  createEdificacion: async (data) => {
    const response = await api.post('/infrastructure/edificaciones', data);
    return response.data;
  },

  // --- ESPACIOS FÍSICOS (HU-14 y HU-15) ---
  getEspacios: async () => {
    const response = await api.get('/infrastructure/espacios');
    return response.data;
  },

  createEspacio: async (data) => {
    const response = await api.post('/infrastructure/espacios', data);
    return response.data;
  },

  updateEstadoEspacio: async (nroIdentificador, estado) => {
    // Para cambiar a "en mantenimiento" (HU-15)
    const response = await api.patch(`/infrastructure/espacios/${nroIdentificador}/estado`, { estado });
    return response.data;
  }
};