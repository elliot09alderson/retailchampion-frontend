// API Configuration
export const API_BASE_URL = 'https://retailchampions.com';

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
  },
  USERS: {
    GET_ALL: `${API_BASE_URL}/api/users`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },
};
