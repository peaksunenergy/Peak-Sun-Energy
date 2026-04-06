// ============================================================
// API Configuration
// ============================================================
// Production: set PRODUCTION_API_URL below to your deployed backend
// Development: uses LOCAL_IP for mobile, localhost for web
// ============================================================

import { Platform } from 'react-native';

// ---------- CHANGE THESE ----------
const LOCAL_IP = '192.168.1.73';           // Your machine's local IP (ipconfig)
const PRODUCTION_API_URL = 'https://peak-sun-energy.onrender.com/api';
// ----------------------------------

const IS_PRODUCTION = !!PRODUCTION_API_URL;

export const API_URL = IS_PRODUCTION
  ? PRODUCTION_API_URL
  : Platform.select({
      web: 'http://localhost:3000/api',
      default: `http://${LOCAL_IP}:3000/api`,
    });
