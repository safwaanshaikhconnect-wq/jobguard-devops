/**
 * JobGuard Global Configuration
 * 
 * When deploying to Vercel, set the VITE_API_URL environment variable 
 * to your backend endpoint (e.g., https://your-backend.herokuapp.com).
 */

// In production (Vercel), default to /api (same domain — no CORS needed).
// In development, default to localhost:8000 (backend running separately).
const rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
