/**
 * EduDocente — Unified API Service Client
 */
const BASE_URL = '';

function getHeaders(extraHeaders = {}, includeJsonContentType = true) {
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

async function handleResponse(response) {
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

export const api = {
  // --- AUTH ---
  async login(email, password) {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const user = await handleResponse(r);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },
  async register(email, password, nombre) {
    const r = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre })
    });
    return handleResponse(r);
  },
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('activeClassId');
  },
  getCurrentUser() {
    const s = localStorage.getItem('user');
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) { return null; }
  },

  // --- CLASES ---
  async getClases() {
    return handleResponse(await fetch(`${BASE_URL}/api/clases`, { headers: getHeaders() }));
  },
  async createClase(nombre, grado) {
    return handleResponse(await fetch(`${BASE_URL}/api/clases`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ nombre, grado })
    }));
  },
  async deleteClase(id) {
    return handleResponse(await fetch(`${BASE_URL}/api/clases/${id}`, { method: 'DELETE', headers: getHeaders() }));
  },

  // --- ALUMNOS ---
  async getAlumnos(claseId) {
    return handleResponse(await fetch(`${BASE_URL}/api/alumnos?claseId=${claseId}`, { headers: getHeaders() }));
  },
  async createAlumno(claseId, nombre, padreCorreo, representante = '', telefono = '') {
    return handleResponse(await fetch(`${BASE_URL}/api/alumnos`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ claseId, nombre, padreCorreo, representante, telefono })
    }));
  },
  async updateAlumno(id, nombre, padreCorreo, representante = '', telefono = '') {
    return handleResponse(await fetch(`${BASE_URL}/api/alumnos/${id}`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ nombre, padreCorreo, representante, telefono })
    }));
  },
  async deleteAlumno(id) {
    return handleResponse(await fetch(`${BASE_URL}/api/alumnos/${id}`, { method: 'DELETE', headers: getHeaders() }));
  },

  // --- UNIDADES DIDÁCTICAS (RF-D02) ---
  async getUnidades(claseId) {
    return handleResponse(await fetch(`${BASE_URL}/api/unidades?claseId=${claseId}`, { headers: getHeaders() }));
  },
  async createUnidad(data) {
    return handleResponse(await fetch(`${BASE_URL}/api/unidades`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
    }));
  },
  async updateUnidad(id, data) {
    return handleResponse(await fetch(`${BASE_URL}/api/unidades/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data)
    }));
  },
  async deleteUnidad(id) {
    return handleResponse(await fetch(`${BASE_URL}/api/unidades/${id}`, { method: 'DELETE', headers: getHeaders() }));
  },
  async clonarUnidad(id) {
    return handleResponse(await fetch(`${BASE_URL}/api/unidades/${id}/clonar`, {
      method: 'POST', headers: getHeaders()
    }));
  },

  // --- EVALUACIONES (RF-D03) ---
  async getEvaluaciones(claseId) {
    return handleResponse(await fetch(`${BASE_URL}/api/evaluaciones?claseId=${claseId}`, { headers: getHeaders() }));
  },
  async getEvaluacionesAlumno(alumnoId) {
    return handleResponse(await fetch(`${BASE_URL}/api/evaluaciones?alumnoId=${alumnoId}`, { headers: getHeaders() }));
  },
  async createEvaluacion(data) {
    return handleResponse(await fetch(`${BASE_URL}/api/evaluaciones`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
    }));
  },

  // --- MONITOREO (RF-D06) ---
  async getMonitoreo(alumnoId, unidadId) {
    const q = unidadId ? `?unidadId=${unidadId}` : '';
    return handleResponse(await fetch(`${BASE_URL}/api/monitoreo/${alumnoId}${q}`, { headers: getHeaders() }));
  },
  async saveMonitoreo(data) {
    return handleResponse(await fetch(`${BASE_URL}/api/monitoreo`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
    }));
  },

  // --- AUTOEVALUACIÓN (RF-D07) ---
  async getAutoevaluaciones(claseId, alumnoId, unidadId) {
    let q = `claseId=${claseId}`;
    if (alumnoId) q += `&alumnoId=${alumnoId}`;
    if (unidadId) q += `&unidadId=${unidadId}`;
    return handleResponse(await fetch(`${BASE_URL}/api/autoevaluacion?${q}`, { headers: getHeaders() }));
  },
  async createAutoevaluacion(data) {
    return handleResponse(await fetch(`${BASE_URL}/api/autoevaluacion`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data)
    }));
  },

  // --- MATRIZ DE EVALUACIONES ---
  async getMatriz(claseId, unidadId) {
    return handleResponse(await fetch(`${BASE_URL}/api/evaluaciones-matriz/${claseId}/${unidadId}`, { headers: getHeaders() }));
  },

  // --- TAREAS (legacy) ---
  async getTareas(claseId) {
    return handleResponse(await fetch(`${BASE_URL}/api/tareas?claseId=${claseId}`, { headers: getHeaders() }));
  },
  async createTarea(claseId, data) {
    return handleResponse(await fetch(`${BASE_URL}/api/tareas`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ claseId, ...data })
    }));
  },
  async deleteTarea(id) {
    return handleResponse(await fetch(`${BASE_URL}/api/tareas/${id}`, { method: 'DELETE', headers: getHeaders() }));
  },

  // --- NOTAS (legacy) ---
  async getNotas(claseId) {
    return handleResponse(await fetch(`${BASE_URL}/api/notas?claseId=${claseId}`, { headers: getHeaders() }));
  },
  async saveNota(alumnoId, tareaId, valor, comentario) {
    return handleResponse(await fetch(`${BASE_URL}/api/notas`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ alumnoId, tareaId, valor, comentario })
    }));
  },

  // --- UPLOAD ---
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const r = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST', headers: getHeaders({}, false), body: formData
    });
    if (!r.ok) throw new Error('Error al subir el archivo.');
    return r.json();
  }
};
