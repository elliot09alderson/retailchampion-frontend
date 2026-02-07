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
    SELECTABLE: `${API_BASE_URL}/api/lottery/selectable`,
    PUBLIC_WINNERS: `${API_BASE_URL}/api/lottery/public/winners`,
    DELETE: (id: string) => `${API_BASE_URL}/api/lottery/${id}`,
    DELETE_ALL: `${API_BASE_URL}/api/lottery/history/all`,
  },
  USERS: {
    GET_ALL: `${API_BASE_URL}/api/users`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE_ALL: `${API_BASE_URL}/api/users`,
    COUNT: `${API_BASE_URL}/api/users/count`,
  },
  PACKAGES: {
    LIST: `${API_BASE_URL}/api/packages`,
    CREATE: `${API_BASE_URL}/api/packages`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/packages/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/packages/${id}`,
  },
  PINS: {
    GENERATE: `${API_BASE_URL}/api/pins/generate`,
    LIST: `${API_BASE_URL}/api/pins`,
    STATS: `${API_BASE_URL}/api/pins/stats`,
    VALIDATE: `${API_BASE_URL}/api/pins/validate`,
  },
  VIP: {
    LIST: `${API_BASE_URL}/api/vip`,
    VVIP_LIST: `${API_BASE_URL}/api/vip/vvip`,
    PROFILE: `${API_BASE_URL}/api/vip/profile`,
    GENERATE_REFERRAL: (id: string) => `${API_BASE_URL}/api/vip/${id}/generate-referral`,
    GET_REFERRALS: (id: string) => `${API_BASE_URL}/api/vip/${id}/referrals`,
    VALIDATE_REFERRAL: (code: string) => `${API_BASE_URL}/api/vip/validate-referral/${code}`,
    REGISTER_WITH_REFERRAL: `${API_BASE_URL}/api/vip/register-with-referral`,
    VERIFY_COUPON: `${API_BASE_URL}/api/vip/verify-coupon`,
    SET_PASSWORD: `${API_BASE_URL}/api/vip/set-password`,
    LOGIN: `${API_BASE_URL}/api/vip/login`,
    ATTENDANCE: `${API_BASE_URL}/api/vip/attendance`,
    DELETE: (id: string) => `${API_BASE_URL}/api/vip/${id}`,
    DELETE_ALL: `${API_BASE_URL}/api/vip/delete-all`,
  },
  GALLERY: {
    LIST: `${API_BASE_URL}/api/gallery`,
    UPLOAD: `${API_BASE_URL}/api/gallery`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/gallery/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/gallery/${id}`,
  },
};

