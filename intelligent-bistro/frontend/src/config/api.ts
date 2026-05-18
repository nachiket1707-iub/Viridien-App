// Change this to your backend URL when deploying
// For local development with Expo Go on a physical device, use your machine's LAN IP
// e.g. 'http://192.168.1.100:3001'
export const API_BASE_URL = 'http://localhost:3001';

export const ENDPOINTS = {
  chat: `${API_BASE_URL}/api/chat`,
  menu: `${API_BASE_URL}/api/menu`,
  health: `${API_BASE_URL}/api/health`,
} as const;
