import api from './api';

export const METODOS_TAQUILLA = {
  TARJETA: 'TARJETA',
  PAGO_MOVIL: 'PAGO_MOVIL',
  EFECTIVO: 'EFECTIVO',
  TAI: 'TAI',
};

const BASE_URL = '/pagos';

function normalizeError(error) {
  const message = error?.response?.data?.message || error?.message || 'Error de red';
  return { ...error, friendlyMessage: message };
}

async function request(path, payload) {
  try {
    const response = await api.post(`${BASE_URL}${path}`, {
      ...payload,
      tasa_bcv: payload.tasa_bcv ?? 1.0,
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function pagarTarjeta(payload) {
  return request('/tarjeta', payload);
}

async function pagarPagoMovil(payload) {
  return request('/pago-movil', payload);
}

async function pagarEfectivo(payload) {
  return request('/efectivo', payload);
}

async function pagarTAI(payload) {
  return request('/tai', payload);
}

async function getInvoices() {
  try {
    const response = await api.get(`${BASE_URL}/facturas`);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

async function generateInvoice(payload) {
  try {
    const response = await api.post(`${BASE_URL}/facturas`, payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export default {
  pagarTarjeta,
  pagarPagoMovil,
  pagarEfectivo,
  pagarTAI,
  getInvoices,
  generateInvoice,
};
