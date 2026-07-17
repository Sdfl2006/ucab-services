import api from './api';

export const jobBoardService = {
  // HU-24: Consultar todas las vacantes
  getVacantes: async () => {
    const response = await api.get('/job-board/vacantes');
    return response.data;
  },

  // HU-25: Sugerencias inteligentes (Match de perfil)
  getSugerencias: async (cedula) => {
    const response = await api.get(`/job-board/sugerencias/${cedula}`);
    return response.data;
  },

  // Postulación de un egresado
  postular: async (data) => {
    const response = await api.post('/job-board/postular', data);
    return response.data;
  }
};