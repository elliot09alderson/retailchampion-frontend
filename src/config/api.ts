// API Configuration
const getApiBaseUrl = () => {
  const { hostname, origin } = window.location;
  
  // If we are on localhost, use the explicit port for the backend
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return `http://${hostname}:5007`;
  }
  
  // In production, the Nginx config proxies /api requests to the backend on the same domain
  return origin;
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },
  LOTTERY: {
    CREATE: `${API_BASE_URL}/api/lottery/create`,
    ACTIVE: `${API_BASE_URL}/api/lottery/active`,
    STATUS: (id: string) => `${API_BASE_URL}/api/lottery/${id}/status`,
    PARTICIPANTS: (id: string) => `${API_BASE_URL}/api/lottery/${id}/participants`,
    SPIN: (id: string) => `${API_BASE_URL}/api/lottery/${id}/spin`,
    WINNER: (id: string) => `${API_BASE_URL}/api/lottery/${id}/winner`,
    REGISTER: (id: string) => `${API_BASE_URL}/api/lottery/${id}/register`,
    SEED_PARTICIPANTS: `${API_BASE_URL}/api/lottery/seed/participants`,
    HISTORY: `${API_BASE_URL}/api/lottery/history`,
    DELETE: (id: string) => `${API_BASE_URL}/api/lottery/${id}`,
    DELETE_ALL: `${API_BASE_URL}/api/lottery/history/all`,
  },
  USERS: {
    GET_ALL: `${API_BASE_URL}/api/users`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE_ALL: `${API_BASE_URL}/api/users`,
  },
  PACKAGES: {
    LIST: `${API_BASE_URL}/api/packages`,
    CREATE: `${API_BASE_URL}/api/packages`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/packages/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/packages/${id}`,
  },
};
