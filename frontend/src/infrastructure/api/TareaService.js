/**
 * Infrastructure Layer — Tarea & Nota Services
 */
import { apiClient } from './apiClient.js';

export const TareaService = {
  /** Obtiene tareas de una unidad específica */
  getTareasByUnidad: (unidadId) => apiClient.get(`/api/tareas?unidadId=${unidadId}`),
  /** Obtiene TODAS las tareas de una clase (para la vista de notas) */
  getTareasByClase: (claseId) => apiClient.get(`/api/tareas?claseId=${claseId}`),
  /** @deprecated — alias para compatibilidad */
  getTareas: (claseId) => apiClient.get(`/api/tareas?claseId=${claseId}`),
  createTarea: (claseId, unidadId, data) => apiClient.post('/api/tareas', { claseId, unidadId, ...data }),
  updateTarea: (id, data) => apiClient.put(`/api/tareas/${id}`, data),
  deleteTarea: (id) => apiClient.delete(`/api/tareas/${id}`)
};

export const NotaService = {
  getNotas: (claseId) => apiClient.get(`/api/notas?claseId=${claseId}`),
  saveNota: (alumnoId, tareaId, valor, comentario) =>
    apiClient.post('/api/notas', { alumnoId, tareaId, valor, comentario })
};

export const UploadService = {
  uploadFile: (file) => apiClient.upload(file)
};
