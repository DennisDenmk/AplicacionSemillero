/**
 * Application Layer — useAlumnos Hook
 * Encapsulates student CRUD state and logic.
 */
import { useState } from 'react';
import { AlumnoService } from '../../infrastructure/api/AlumnoService.js';

export function useAlumnos(activeClassId, showToast) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);

  function refresh() {
    if (!activeClassId) { setAlumnos([]); return; }
    setLoading(true);
    AlumnoService.getAlumnos(activeClassId)
      .then(data => setAlumnos(data))
      .catch(err => showToast(err.message || 'Error al cargar alumnos', 'danger'))
      .finally(() => setLoading(false));
  }

  function create(nombre, padreCorreo, representante, telefono, onSuccess) {
    AlumnoService.createAlumno(activeClassId, nombre, padreCorreo, representante, telefono)
      .then(() => { showToast('Estudiante registrado exitosamente', 'success'); refresh(); onSuccess && onSuccess(); })
      .catch(err => showToast(err.message || 'Error al registrar alumno', 'danger'));
  }

  function update(id, nombre, padreCorreo, representante, telefono, onSuccess) {
    AlumnoService.updateAlumno(id, nombre, padreCorreo, representante, telefono)
      .then(() => { showToast('Estudiante actualizado', 'success'); refresh(); onSuccess && onSuccess(); })
      .catch(err => showToast(err.message || 'Error al actualizar alumno', 'danger'));
  }

  function remove(id) {
    if (!window.confirm('¿Está seguro de eliminar este estudiante? Se perderán todas sus calificaciones.')) return;
    AlumnoService.deleteAlumno(id)
      .then(() => { showToast('Estudiante eliminado', 'success'); refresh(); })
      .catch(err => showToast(err.message || 'Error al eliminar estudiante', 'danger'));
  }

  return { alumnos, loading, refresh, create, update, remove };
}
