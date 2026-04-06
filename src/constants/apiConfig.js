// ============================================================
// API Configuration
// ============================================================

import { Platform } from 'react-native';

// ---------- CHANGE THESE ----------
const LOCAL_IP = '192.168.1.73';           // Your machine's local IP (ipconfig)
const PRODUCTION_API_URL = 'https://peak-sun-energy.onrender.com/api';
// ----------------------------------

// __DEV__ is automatic:
//   true  when running with `npx expo start` (dev mode)
//   false when built with `eas build` (production)
// No need to toggle manually!

export const API_URL = __DEV__
  ? Platform.select({
      web: 'http://localhost:3000/api',
      default: `http://${LOCAL_IP}:3000/api`,
    })
  : PRODUCTION_API_URL;
