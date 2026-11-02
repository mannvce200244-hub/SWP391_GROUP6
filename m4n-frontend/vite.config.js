import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'DEV_')

  return {
    server: {
      host: true,
      port: 5173,
      allowedHosts: env.DEV_TUNNEL_HOST ? [env.DEV_TUNNEL_HOST] : [],
      proxy: {
        '/api/v1/auth/google': {
          target: env.DEV_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
        ...(env.DEV_API_PROXY_TARGET ? {
        '/api/v1': {
          target: env.DEV_API_PROXY_TARGET,
          changeOrigin: true,
        },
        } : {}),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
