import process from 'node:process'
import { isIP } from 'node:net'

// Keep browser APIs on Vercel so HttpOnly/SameSite cookies survive MoMo returns.
const backendOrigin = process.env.M4N_BACKEND_ORIGIN || ''
let backend
try { backend = new URL(backendOrigin) } catch {
  throw new Error('Set M4N_BACKEND_ORIGIN to the public HTTPS Railway origin before deploying.')
}
if (backend.protocol !== 'https:' || backendOrigin !== backend.origin
    || backend.port || !backend.hostname.includes('.') || isIP(backend.hostname)
    || backend.hostname.endsWith('.localhost') || backend.hostname.endsWith('.local')
    || backend.hostname.endsWith('.internal') || backend.hostname.endsWith('.trycloudflare.com')) {
  throw new Error('M4N_BACKEND_ORIGIN must be a permanent public HTTPS origin without a path or trailing slash.')
}
if (process.env.VITE_API_BASE_URL && process.env.VITE_API_BASE_URL !== '/api/v1') {
  throw new Error('For Vercel + Railway, VITE_API_BASE_URL must be /api/v1 to preserve login cookies.')
}

export const config = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [
    { source: '/api/v1/:path*', destination: `${backend.origin}/api/v1/:path*` },
    { source: '/:path((?!api(?:/|$)).*)', destination: '/index.html' },
  ],
  headers: [{
    source: '/api/v1/:path*',
    headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
  }],
}
