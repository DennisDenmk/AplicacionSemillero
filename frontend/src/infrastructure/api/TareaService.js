/**
 * Infrastructure Layer — Tarea & Nota Services
 */
import { apiClient } from './apiClient.js';

export const TareaService = {
  getTareas: (claseId) => apiClient.get(`/api/tareas?claseId=${claseId}`),
  createTarea: (claseId, data) => apiClient.post('/api/tareas', { claseId, ...data }),
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
