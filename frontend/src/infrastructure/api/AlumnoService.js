/**
 * Infrastructure Layer — Alumno Service
 */
import { apiClient } from './apiClient.js';

export const AlumnoService = {
  getAlumnos: (claseId) => apiClient.get(`/api/alumnos?claseId=${claseId}`),
  createAlumno: (claseId, nombre, padreCorreo, representante = '', telefono = '') =>
    apiClient.post('/api/alumnos', { claseId, nombre, padreCorreo, representante, telefono }),
  updateAlumno: (id, nombre, padreCorreo, representante = '', telefono = '') =>
    apiClient.put(`/api/alumnos/${id}`, { nombre, padreCorreo, representante, telefono }),
  deleteAlumno: (id) => apiClient.delete(`/api/alumnos/${id}`)
};
