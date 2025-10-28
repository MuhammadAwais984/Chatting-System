
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 👈 allows access from other devices on LAN
    port: 5173, // or any port you prefer
    strictPort: true,
    allowedHosts: 'all', // 👈 allows cloudflare/ngrok/etc. (useful for future)
  },
});
