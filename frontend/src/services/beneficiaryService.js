import api from './api';

const BASE_URL = '/beneficiarios';

function normalizeError(error) {
  const message = error?.response?.data?.message || error?.message || 'Error de red';
  return { ...error, friendlyMessage: message };
}

async function listarMisBeneficiarios() {
  try {
    const response = await api.get(`${BASE_URL}/mis-beneficiarios`);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function listarBeneficiariosAdmin() {
  try {
    const response = await api.get(`${BASE_URL}`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function subirConstanciaEstudios(cedula, payload) {
  try {
    const response = await api.put(`${BASE_URL}/${cedula}/constancia`, payload);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export default {
  listarMisBeneficiarios,
  listarBeneficiariosAdmin,
  subirConstanciaEstudios,
};
