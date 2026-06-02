/**
 * Legacy API facade — preserved for backward compatibility with existing view components.
 * All calls are delegated to the new infrastructure service layer.
 *
 * @deprecated Prefer importing services directly from src/infrastructure/api/
 */
import { AuthService } from '../infrastructure/api/AuthService.js';
import { ClaseService } from '../infrastructure/api/ClaseService.js';
import { AlumnoService } from '../infrastructure/api/AlumnoService.js';
import { TareaService, NotaService, UploadService } from '../infrastructure/api/TareaService.js';
import { UnidadService, EvaluacionService } from '../infrastructure/api/EvaluacionService.js';

export const api = {
  // Auth
  login:          (email, password) => AuthService.login(email, password),
  register:       (email, password, nombre) => AuthService.register(email, password, nombre),
  logout:         () => AuthService.logout(),
  getCurrentUser: () => AuthService.getCurrentUser(),

  // Clases
  getClases:    () => ClaseService.getClases(),
  createClase:  (nombre, grado) => ClaseService.createClase(nombre, grado),
  deleteClase:  (id) => ClaseService.deleteClase(id),

  // Alumnos
  getAlumnos:   (claseId) => AlumnoService.getAlumnos(claseId),
  createAlumno: (claseId, nombre, padreCorreo, representante, telefono) =>
    AlumnoService.createAlumno(claseId, nombre, padreCorreo, representante, telefono),
  updateAlumno: (id, nombre, padreCorreo, representante, telefono) =>
    AlumnoService.updateAlumno(id, nombre, padreCorreo, representante, telefono),
  deleteAlumno: (id) => AlumnoService.deleteAlumno(id),

  // Unidades
  getUnidades:  (claseId) => UnidadService.getUnidades(claseId),
  createUnidad: (data) => UnidadService.createUnidad(data),
  updateUnidad: (id, data) => UnidadService.updateUnidad(id, data),
  deleteUnidad: (id) => UnidadService.deleteUnidad(id),
  clonarUnidad: (id) => UnidadService.clonarUnidad(id),

  // Evaluaciones
  getEvaluaciones:      (claseId) => EvaluacionService.getEvaluaciones(claseId),
  getEvaluacionesAlumno:(alumnoId) => EvaluacionService.getEvaluacionesAlumno(alumnoId),
  createEvaluacion:     (data) => EvaluacionService.createEvaluacion(data),
  getMonitoreo:         (alumnoId, unidadId, tareaId) => EvaluacionService.getMonitoreo(alumnoId, unidadId, tareaId),
  saveMonitoreo:        (data) => EvaluacionService.saveMonitoreo(data),
  getAutoevaluaciones:  (claseId, alumnoId, unidadId, tareaId) => EvaluacionService.getAutoevaluaciones(claseId, alumnoId, unidadId, tareaId),
  createAutoevaluacion: (data) => EvaluacionService.createAutoevaluacion(data),
  getMatriz:            (claseId, unidadId, tareaId) => EvaluacionService.getMatriz(claseId, unidadId, tareaId),

  // Tareas (por unidad — flujo principal)
  getTareasByUnidad: (unidadId) => TareaService.getTareasByUnidad(unidadId),
  getTareasByClase:  (claseId)  => TareaService.getTareasByClase(claseId),
  getTareas:    (claseId) => TareaService.getTareas(claseId),  // legacy alias
  createTarea:  (claseId, unidadId, data) => TareaService.createTarea(claseId, unidadId, data),
  updateTarea:  (id, data) => TareaService.updateTarea(id, data),
  deleteTarea:  (id) => TareaService.deleteTarea(id),

  // Notas (legacy)
  getNotas:   (claseId) => NotaService.getNotas(claseId),
  saveNota:   (alumnoId, tareaId, valor, comentario) => NotaService.saveNota(alumnoId, tareaId, valor, comentario),

  // Upload
  uploadFile: (file) => UploadService.uploadFile(file)
};
