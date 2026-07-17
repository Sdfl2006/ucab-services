import api from './api';

const BASE_URL = '/solicitudes';

function normalizeError(error) {
  const message = error?.response?.data?.message || error?.message || 'Error de red';
  return { ...error, friendlyMessage: message };
}

async function getRequests() {
  try {
    const response = await api.get(BASE_URL);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function createRequest(payload) {
  try {
    const response = await api.post(BASE_URL, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function getSeguimiento(nroSolicitud) {
  try {
    const response = await api.get(`${BASE_URL}/${nroSolicitud}/seguimiento`);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function agregarAcompanante(nroSolicitud, payload) {
  try {
    const response = await api.post(`${BASE_URL}/${nroSolicitud}/acompanantes`, payload);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function completarPaso(nroSolicitud, nroPaso) {
  try {
    const response = await api.put(`${BASE_URL}/${nroSolicitud}/pasos/${nroPaso}/completar`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export default {
  getRequests,
  createRequest,
  getSeguimiento,
  agregarAcompanante,
  completarPaso,
};
