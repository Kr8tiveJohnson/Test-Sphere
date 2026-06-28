/**
 * api-config.js
 * Auto-detects the correct API base URL so the same code works
 * both locally (http://127.0.0.1:5000) and on Vercel (same origin).
 */
const API_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:5000'
    : window.location.origin;
