/**
 * Infrastructure Layer — Unidad, Evaluacion, Monitoreo, Autoevaluacion Services
 */
import { apiClient } from './apiClient.js';

export const UnidadService = {
  getUnidades: (claseId) => apiClient.get(`/api/unidades?claseId=${claseId}`),
  createUnidad: (data) => apiClient.post('/api/unidades', data),
  updateUnidad: (id, data) => apiClient.put(`/api/unidades/${id}`, data),
  deleteUnidad: (id) => apiClient.delete(`/api/unidades/${id}`),
  clonarUnidad: (id) => apiClient.post(`/api/unidades/${id}/clonar`, {})
};

export const EvaluacionService = {
  getEvaluaciones: (claseId) => apiClient.get(`/api/evaluaciones?claseId=${claseId}`),
  getEvaluacionesAlumno: (alumnoId) => apiClient.get(`/api/evaluaciones?alumnoId=${alumnoId}`),
  createEvaluacion: (data) => apiClient.post('/api/evaluaciones', data),
  getMonitoreo: (alumnoId, unidadId) => {
    const q = unidadId ? `?unidadId=${unidadId}` : '';
    return apiClient.get(`/api/monitoreo/${alumnoId}${q}`);
  },
  saveMonitoreo: (data) => apiClient.post('/api/monitoreo', data),
  getAutoevaluaciones: (claseId, alumnoId, unidadId) => {
    let q = `claseId=${claseId}`;
    if (alumnoId) q += `&alumnoId=${alumnoId}`;
    if (unidadId) q += `&unidadId=${unidadId}`;
    return apiClient.get(`/api/autoevaluacion?${q}`);
  },
  createAutoevaluacion: (data) => apiClient.post('/api/autoevaluacion', data),
  getMatriz: (claseId, unidadId) => apiClient.get(`/api/evaluaciones-matriz/${claseId}/${unidadId}`)
};
