import api from './api';

export const jobBoardService = {
  // HU-24: Consultar todas las vacantes
  getVacantes: async () => {
    const response = await api.get('/bolsa-trabajo/vacantes');
    return response.data?.data || response.data;
  },
  
  // HU-24: Crear una nueva vacante (Admin / Personal Administrativo)
  createVacante: async (data) => {
    const response = await api.post('/bolsa-trabajo/vacantes', data);
    return response.data;
  },
  
  // HU-25: Sugerencias inteligentes (Match de perfil)
  getSugerencias: async () => {
    const response = await api.get('/bolsa-trabajo/sugerencias');
    return response.data?.data || response.data;
  },
  
  // Postulación de un egresado
  postular: async (data) => {
    const response = await api.post('/bolsa-trabajo/postular', data);
    return response.data;
  }
};