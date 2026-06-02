const { pool } = require('../infrastructure/database/postgres');
const { mapEvaluacion, mapMonitoreo, mapAutoevaluacion } = require('../domain/models');
const { isValidUuid } = require('../domain/utils');

class EvaluacionRepository {
  async findAllByClase(claseId) {
    const result = await pool.query(
      'SELECT * FROM evaluaciones WHERE clase_id = $1 ORDER BY created_at ASC',
      [claseId]
    );
    return result.rows.map(mapEvaluacion);
  }

  async findAllByAlumno(alumnoId) {
    const result = await pool.query(
      'SELECT * FROM evaluaciones WHERE alumno_id = $1 ORDER BY created_at ASC',
      [alumnoId]
    );
    return result.rows.map(mapEvaluacion);
  }

  async create(alumnoId, unidadId, claseId, rubrica, notaEscrita, tareaId = null) {
    const result = await pool.query(
      `INSERT INTO evaluaciones (alumno_id,unidad_id,clase_id,rubrica,nota_escrita,tarea_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        alumnoId, 
        unidadId && isValidUuid(unidadId) ? unidadId : null, 
        claseId, 
        JSON.stringify(rubrica), 
        notaEscrita || null,
        tareaId && isValidUuid(tareaId) ? tareaId : null
      ]
    );
    return mapEvaluacion(result.rows[0]);
  }
}

class MonitoreoRepository {
  async findByAlumno(alumnoId, unidadId, tareaId = null) {
    let result;
    if (tareaId && isValidUuid(tareaId)) {
      result = await pool.query(
        'SELECT * FROM monitoreo WHERE alumno_id = $1 AND tarea_id = $2',
        [alumnoId, tareaId]
      );
    } else if (unidadId && isValidUuid(unidadId)) {
      result = await pool.query(
        'SELECT * FROM monitoreo WHERE alumno_id = $1 AND unidad_id = $2',
        [alumnoId, unidadId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM monitoreo WHERE alumno_id = $1 AND unidad_id IS NULL AND tarea_id IS NULL',
        [alumnoId]
      );
    }
    return result.rows.length > 0 ? mapMonitoreo(result.rows[0]) : null;
  }

  async upsert(data) {
    const { alumnoId, unidadId, tareaId, clasificacionObs, clasificacionApoyo, seriacionObs, seriacionApoyo,
      asimilacionObs, asimilacionApoyo, justificacionObs, justificacionApoyo,
      autorregulacionObs, autorregulacionApoyo, notaSeguimientoObs, notaSeguimientoApoyo } = data;
    const unidad = unidadId && isValidUuid(unidadId) ? unidadId : null;
    const tarea = tareaId && isValidUuid(tareaId) ? tareaId : null;

    const exists = await pool.query(
      'SELECT * FROM monitoreo WHERE alumno_id=$1 AND (tarea_id=$2 OR ($2 IS NULL AND tarea_id IS NULL AND (unidad_id=$3 OR ($3 IS NULL AND unidad_id IS NULL))))',
      [alumnoId, tarea, unidad]
    );

    if (exists.rows.length > 0) {
      const oldRow = exists.rows[0];
      const result = await pool.query(
        `UPDATE monitoreo SET 
          clasificacion_obs=$1,clasificacion_apoyo=$2,seriacion_obs=$3,seriacion_apoyo=$4,
          asimilacion_obs=$5,asimilacion_apoyo=$6,justificacion_obs=$7,justificacion_apoyo=$8,
          autorregulacion_obs=$9,autorregulacion_apoyo=$10,
          nota_seguimiento_obs=$11,nota_seguimiento_apoyo=$12,
          updated_at=now() 
         WHERE id=$13 RETURNING *`,
        [
          clasificacionObs !== undefined ? clasificacionObs : oldRow.clasificacion_obs,
          clasificacionApoyo !== undefined ? clasificacionApoyo : oldRow.clasificacion_apoyo,
          seriacionObs !== undefined ? seriacionObs : oldRow.seriacion_obs,
          seriacionApoyo !== undefined ? seriacionApoyo : oldRow.seriacion_apoyo,
          asimilacionObs !== undefined ? asimilacionObs : oldRow.asimilacion_obs,
          asimilacionApoyo !== undefined ? asimilacionApoyo : oldRow.asimilacion_apoyo,
          justificacionObs !== undefined ? justificacionObs : oldRow.justificacion_obs,
          justificacionApoyo !== undefined ? justificacionApoyo : oldRow.justificacion_apoyo,
          autorregulacionObs !== undefined ? autorregulacionObs : oldRow.autorregulacion_obs,
          autorregulacionApoyo !== undefined ? autorregulacionApoyo : oldRow.autorregulacion_apoyo,
          notaSeguimientoObs !== undefined ? notaSeguimientoObs : oldRow.nota_seguimiento_obs,
          notaSeguimientoApoyo !== undefined ? notaSeguimientoApoyo : oldRow.nota_seguimiento_apoyo,
          oldRow.id
        ]
      );
      return mapMonitoreo(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO monitoreo (
        alumno_id,unidad_id,tarea_id,
        clasificacion_obs,clasificacion_apoyo,
        seriacion_obs,seriacion_apoyo,
        asimilacion_obs,asimilacion_apoyo,
        justificacion_obs,justificacion_apoyo,
        autorregulacion_obs,autorregulacion_apoyo,
        nota_seguimiento_obs,nota_seguimiento_apoyo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        alumnoId, 
        unidad, 
        tarea,
        clasificacionObs || null, 
        clasificacionApoyo || null, 
        seriacionObs || null, 
        seriacionApoyo || null,
        asimilacionObs || null, 
        asimilacionApoyo || null, 
        justificacionObs || null, 
        justificacionApoyo || null,
        autorregulacionObs || null, 
        autorregulacionApoyo || null,
        notaSeguimientoObs || null,
        notaSeguimientoApoyo || null
      ]
    );
    return mapMonitoreo(result.rows[0]);
  }
}

class AutoevaluacionRepository {
  async find(docenteId, claseId, alumnoId, unidadId, tareaId = null) {
    let result;
    if (unidadId && isValidUuid(unidadId) && (!alumnoId || alumnoId === 'null' || alumnoId === 'undefined')) {
      result = await pool.query(
        'SELECT * FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND unidad_id=$3 AND alumno_id IS NULL ORDER BY created_at DESC LIMIT 1',
        [docenteId, claseId, unidadId]
      );
    } else if (alumnoId && isValidUuid(alumnoId) && tareaId && isValidUuid(tareaId)) {
      result = await pool.query(
        'SELECT * FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND alumno_id=$3 AND tarea_id=$4 ORDER BY created_at DESC LIMIT 1',
        [docenteId, claseId, alumnoId, tareaId]
      );
    } else if (alumnoId && isValidUuid(alumnoId) && unidadId && isValidUuid(unidadId)) {
      result = await pool.query(
        'SELECT * FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND alumno_id=$3 AND unidad_id=$4 ORDER BY created_at DESC LIMIT 1',
        [docenteId, claseId, alumnoId, unidadId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 ORDER BY created_at DESC',
        [docenteId, claseId]
      );
    }
    return result.rows.map(mapAutoevaluacion);
  }

  async upsert(docenteId, claseId, unidadId, alumnoId, respuestas, tareaId = null) {
    const unidad = unidadId && isValidUuid(unidadId) ? unidadId : null;
    const alumno = alumnoId && isValidUuid(alumnoId) ? alumnoId : null;
    const tarea = tareaId && isValidUuid(tareaId) ? tareaId : null;

    let exists;
    if (alumno === null) {
      exists = await pool.query(
        'SELECT id FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND unidad_id=$3 AND alumno_id IS NULL',
        [docenteId, claseId, unidad]
      );
    } else {
      exists = await pool.query(
        'SELECT id FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND alumno_id=$3 AND (tarea_id=$4 OR ($4 IS NULL AND tarea_id IS NULL AND (unidad_id=$5 OR ($5 IS NULL AND unidad_id IS NULL))))',
        [docenteId, claseId, alumno, tarea, unidad]
      );
    }

    if (exists.rows.length > 0) {
      const result = await pool.query(
        'UPDATE autoevaluacion SET respuestas=$1 WHERE id=$2 RETURNING *',
        [JSON.stringify(respuestas), exists.rows[0].id]
      );
      return mapAutoevaluacion(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO autoevaluacion (docente_id,unidad_id,alumno_id,clase_id,respuestas,tarea_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [docenteId, unidad, alumno, claseId, JSON.stringify(respuestas), tarea]
    );
    return mapAutoevaluacion(result.rows[0]);
  }
}

module.exports = {
  evaluacionRepository: new EvaluacionRepository(),
  monitoreoRepository: new MonitoreoRepository(),
  autoevaluacionRepository: new AutoevaluacionRepository()
};
