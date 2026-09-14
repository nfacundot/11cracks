import type { CapacitorConfig } from '@capacitor/cli';

const PROD_URL = process.env.CAPACITOR_SERVER_URL || 'https://11cracks.vercel.app';
const LAN_IP = process.env.LAN_IP || '192.168.18.24';
const PORT = process.env.PORT || '3000';

const config: CapacitorConfig = {
  appId: 'com.elevencracks.mobile',
  appName: '11Cracks',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_MODE === 'lan' ? `http://${LAN_IP}:${PORT}` : PROD_URL,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
