import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 25565,
    strictPort: true,
    allowedHosts: ['192.168.3.2', 'localhost'], // ← ОБЯЗАТЕЛЬНО ДОБАВЬ
    hmr: {
      host: '192.168.3.2' // чтобы Hot Reload не ломался на телефоне
    }
  }
})
