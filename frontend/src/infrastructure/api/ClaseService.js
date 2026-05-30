/**
 * Infrastructure Layer — Clase Service
 */
import { apiClient } from './apiClient.js';

export const ClaseService = {
  getClases: () => apiClient.get('/api/clases'),
  createClase: (nombre, grado) => apiClient.post('/api/clases', { nombre, grado }),
  deleteClase: (id) => apiClient.delete(`/api/clases/${id}`)
};
