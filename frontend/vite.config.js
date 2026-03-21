import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://api:8000',
      '/categories': 'http://api:8000',
      '/products': 'http://api:8000',
      '/dashboard': 'http://api:8000',
      '/sales': 'http://api:8000',
    },
  },
})
