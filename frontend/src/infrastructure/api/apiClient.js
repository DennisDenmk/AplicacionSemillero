/**
 * Infrastructure Layer — API Client
 * Handles all HTTP communication with the backend.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '';

export function getHeaders(extraHeaders = {}, includeJsonContentType = true) {
  const headers = includeJsonContentType
    ? { 'Content-Type': 'application/json', ...extraHeaders }
    : { ...extraHeaders };
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const p = JSON.parse(user);
      if (p && p.id) headers['user-id'] = p.id;
    } catch (e) {}
  }
  return headers;
}

export async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'Ha ocurrido un error en la solicitud.';
    try {
      const d = await response.json();
      if (d && d.error) errorMessage = d.error;
    } catch (e) {}
    throw new Error(errorMessage);
  }
  return response.json();
}

export const apiClient = {
  async get(path) {
    return handleResponse(await fetch(`${BASE_URL}${path}`, { headers: getHeaders() }));
  },
  async post(path, body) {
    return handleResponse(await fetch(`${BASE_URL}${path}`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(body)
    }));
  },
  async put(path, body) {
    return handleResponse(await fetch(`${BASE_URL}${path}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(body)
    }));
  },
  async delete(path) {
    return handleResponse(await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: getHeaders() }));
  },
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    const r = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST', headers: getHeaders({}, false), body: formData
    });
    if (!r.ok) throw new Error('Error al subir el archivo.');
    return r.json();
  }
};
