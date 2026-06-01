const API = 'http://localhost:3000/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function getTable() { return localStorage.getItem('table_number'); }
function getCart() { const c = localStorage.getItem('cart'); return c ? JSON.parse(c) : []; }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }
function clearCart() { localStorage.removeItem('cart'); }
function formatPrice(n) { return '₹' + parseFloat(n).toFixed(2); }
function cartCount() { return getCart().reduce((sum, i) => sum + i.quantity, 0); }

function requireAuth() {
  if (!getToken()) { window.location.href = '/'; }
}
function requireTable() {
  if (!getTable()) { window.location.href = '/table'; }
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API + endpoint, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  const data = await res.json();

  // Token expired or invalid → clear and redirect to login
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }

  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// ── Dark / Light mode ──
function getTheme() { return localStorage.getItem('theme') || 'light'; }

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
}

function toggleTheme() {
  const current = getTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Apply on every page load
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
});
