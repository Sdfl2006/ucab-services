import api from './api';

const BASE_URL = '/servicios';

function normalizeError(error) {
  const message = error?.response?.data?.message || error?.message || 'Error de red';
  return { ...error, friendlyMessage: message };
}

async function getAllServices() {
  try {
    const response = await api.get(BASE_URL);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function getServiceById(codigo) {
  try {
    const response = await api.get(`${BASE_URL}/${codigo}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export default {
  getAllServices,
  getServiceById,
};
