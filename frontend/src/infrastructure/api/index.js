/**
 * Infrastructure Index — re-exports all services for backwards compatibility.
 * The existing services/api.js continues to work by delegating to these services.
 */
export { AuthService } from './AuthService.js';
export { ClaseService } from './ClaseService.js';
export { AlumnoService } from './AlumnoService.js';
export { TareaService, NotaService, UploadService } from './TareaService.js';
export { UnidadService, EvaluacionService } from './EvaluacionService.js';
