import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'convention-app-quermdpjl.apps.run.brev.nvidia.com',
      'convention-z6ac2skfl.apps.run.brev.nvidia.com',
      'localhost',
      '127.0.0.1',
    ],
  },
  base: '/NJIORG-Convention-2026-/',
})