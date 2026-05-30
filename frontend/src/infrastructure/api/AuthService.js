/**
 * Infrastructure Layer — Auth Service
 * Handles all authentication-related API calls and local session management.
 */
import { apiClient, getHeaders, handleResponse } from './apiClient.js';

const BASE_URL = '';

export const AuthService = {
  async login(email, password) {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const user = await handleResponse(r);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async register(email, password, nombre) {
    return apiClient.post('/api/auth/register', { email, password, nombre });
  },

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('activeClassId');
  },

  getCurrentUser() {
    const s = localStorage.getItem('user');
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) { return null; }
  }
};
