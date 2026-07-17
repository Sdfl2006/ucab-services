import api from './api';

const SESSION_KEY = 'ucab_user_session';
const DEVICE_KEY = 'ucab_device_uuid';
const BASE_URL = '/auth';

function ensureDeviceUuid() {
  let uuid = localStorage.getItem(DEVICE_KEY);
  if (!uuid) {
    uuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem(DEVICE_KEY, uuid);
  }
  return uuid;
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error parsing session from localStorage:', error);
    return null;
  }
}

async function login(correo, password) {
  const response = await api.post(`${BASE_URL}/login`, {
    correo,
    password,
    uuid_dispositivo: ensureDeviceUuid(),
  });

  const session = {
    token: response.data.token,
    user: response.data.user,
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return response.data.user;
}

function logout() {
  clearSession();
}

function getUserFromToken() {
  const session = getStoredSession();
  return session?.user ?? null;
}

export default {
  login,
  logout,
  getUserFromToken,
  getStoredSession,
};
