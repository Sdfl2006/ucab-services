import api from './api';

const BASE_URL = '/users';

async function registrar(payload) {
  const response = await api.post(`${BASE_URL}/register`, payload);
  return response.data;
}

export default {
  registrar,
};
