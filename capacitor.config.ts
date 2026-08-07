import type { CapacitorConfig } from '@capacitor/cli';

const LAN_IP = process.env.LAN_IP || '192.168.18.24';
const PORT = process.env.PORT || '3000';

const config: CapacitorConfig = {
  appId: 'com.elevencracks.mobile',
  appName: '11Cracks',
  webDir: 'out',
  server: {
    url: `http://${LAN_IP}:${PORT}`,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
