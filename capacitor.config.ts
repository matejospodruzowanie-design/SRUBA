import { CapacitorConfig } from '@capacitor/cli';

// Emulator uses 10.0.2.2 to reach host machine
// Physical device uses your LAN IP
const DEV_URL = process.env.CAPACITOR_URL || 'http://192.168.1.221:3000';

const config: CapacitorConfig = {
  appId: 'com.sruba.app',
  appName: 'ŚRUBA',
  webDir: 'out',
  server: {
    url: DEV_URL,
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
