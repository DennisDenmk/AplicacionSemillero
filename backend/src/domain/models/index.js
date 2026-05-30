/**
 * Domain Models — Data mapping functions from DB rows to domain objects.
 * These are pure functions that transform raw DB data into clean application objects.
 */

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email
  };
}

function mapClase(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    grado: row.grado,
    userId: row.docente_id,
    numAlumnos: row.num_alumnos ? parseInt(row.num_alumnos) : 0,
    alumnosNombres: row.alumnos_nombres ? row.alumnos_nombres : []
  };
}

function mapAlumno(row) {
  if (!row) return null;
  return {
    id: row.id,
    claseId: row.clase_id,
    nombre: row.nombre,
    representante: row.representante || '',
    padreCorreo: row.padre_correo,
    telefono: row.telefono || '',
    activo: row.activo !== false
  };
}

function mapTarea(row) {
  if (!row) return null;
  return {
    id: row.id,
    claseId: row.clase_id,
    titulo: row.titulo,
    imagenUrl: row.imagen_url,
    actividadTipo: row.actividad_tipo,
    detalles: typeof row.detalles === 'string' ? JSON.parse(row.detalles) : row.detalles,
    materiales: typeof row.materiales === 'string' ? JSON.parse(row.materiales) : (row.materiales || [])
  };
}

function mapNota(row) {
  if (!row) return null;
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    tareaId: row.tarea_id,
    valor: parseFloat(row.valor),
    comentario: row.comentario
  };
}

function mapUnidad(row) {
  if (!row) return null;
  return {
    id: row.id,
    claseId: row.clase_id,
    titulo: row.titulo,
    ambito: row.ambito,
    objetivoGeneral: row.objetivo_general,
    objetivoAprendizaje: row.objetivo_aprendizaje,
    destrezas: row.destrezas,
    semanasPrevistas: row.semanas_previstas,
    descripcionActividades: row.descripcion_actividades,
    imagenUrl: row.imagen_url,
    tecnicasDidacticas: row.tecnicas_didacticas,
    criteriosEvaluacion: row.criterios_evaluacion,
    materiales: typeof row.materiales === 'string' ? JSON.parse(row.materiales) : (row.materiales || []),
    archivada: row.archivada,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapEvaluacion(row) {
  if (!row) return null;
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    unidadId: row.unidad_id,
    claseId: row.clase_id,
    rubrica: typeof row.rubrica === 'string' ? JSON.parse(row.rubrica) : (row.rubrica || {}),
    notaEscrita: row.nota_escrita,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMonitoreo(row) {
  if (!row) return null;
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    clasificacionObs: row.clasificacion_obs,
    clasificacionApoyo: row.clasificacion_apoyo,
    seriacionObs: row.seriacion_obs,
    seriacionApoyo: row.seriacion_apoyo,
    asimilacionObs: row.asimilacion_obs,
    asimilacionApoyo: row.asimilacion_apoyo,
    justificacionObs: row.justificacion_obs,
    justificacionApoyo: row.justificacion_apoyo,
    autorregulacionObs: row.autorregulacion_obs,
    autorregulacionApoyo: row.autorregulacion_apoyo,
    updatedAt: row.updated_at
  };
}

function mapAutoevaluacion(row) {
  if (!row) return null;
  return {
    id: row.id,
    docenteId: row.docente_id,
    unidadId: row.unidad_id,
    claseId: row.clase_id,
    respuestas: typeof row.respuestas === 'string' ? JSON.parse(row.respuestas) : (row.respuestas || []),
    createdAt: row.created_at
  };
}

module.exports = {
  mapUser,
  mapClase,
  mapAlumno,
  mapTarea,
  mapNota,
  mapUnidad,
  mapEvaluacion,
  mapMonitoreo,
  mapAutoevaluacion
};
