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

const solicitarRecargaTAI = async (payload) => {
  const response = await api.post(`${BASE_URL}/tai/recarga`, payload);
  return response.data;
};

const getRecargasPendientes = async () => {
  const response = await api.get(`${BASE_URL}/tai/recargas-pendientes`);
  return response.data?.data || response.data;
};

const aprobarRecarga = async (idMovimiento) => {
  const response = await api.put(`${BASE_URL}/tai/recarga/${idMovimiento}/aprobar`);
  return response.data;
};

const getSaldoTAI = async () => {
  const response = await api.get(`${BASE_URL}/tai/saldo`);
  return response.data?.saldo || 0;
};

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

const pagarTAIOnline = async (payload) => {
  const response = await api.post(`${BASE_URL}/tai/online`, payload);
  return response.data;
};

export default {
  pagarTarjeta,
  pagarPagoMovil,
  pagarEfectivo,
  pagarTAI,
  getInvoices,
  generateInvoice,
  solicitarRecargaTAI,
  getRecargasPendientes,
  aprobarRecarga,
  getSaldoTAI,
  pagarTAIOnline,
};
