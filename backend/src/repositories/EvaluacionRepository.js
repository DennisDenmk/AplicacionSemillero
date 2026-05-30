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

  async create(alumnoId, unidadId, claseId, rubrica, notaEscrita) {
    const result = await pool.query(
      `INSERT INTO evaluaciones (alumno_id,unidad_id,clase_id,rubrica,nota_escrita) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [alumnoId, unidadId && isValidUuid(unidadId) ? unidadId : null, claseId, JSON.stringify(rubrica), notaEscrita || null]
    );
    return mapEvaluacion(result.rows[0]);
  }
}

class MonitoreoRepository {
  async findByAlumno(alumnoId, unidadId) {
    let result;
    if (unidadId && isValidUuid(unidadId)) {
      result = await pool.query(
        'SELECT * FROM monitoreo WHERE alumno_id = $1 AND unidad_id = $2',
        [alumnoId, unidadId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM monitoreo WHERE alumno_id = $1 AND unidad_id IS NULL',
        [alumnoId]
      );
    }
    return result.rows.length > 0 ? mapMonitoreo(result.rows[0]) : null;
  }

  async upsert(data) {
    const { alumnoId, unidadId, clasificacionObs, clasificacionApoyo, seriacionObs, seriacionApoyo,
      asimilacionObs, asimilacionApoyo, justificacionObs, justificacionApoyo,
      autorregulacionObs, autorregulacionApoyo } = data;
    const unidad = unidadId && isValidUuid(unidadId) ? unidadId : null;

    const exists = await pool.query(
      'SELECT id FROM monitoreo WHERE alumno_id=$1 AND (unidad_id=$2 OR ($2 IS NULL AND unidad_id IS NULL))',
      [alumnoId, unidad]
    );

    if (exists.rows.length > 0) {
      const result = await pool.query(
        `UPDATE monitoreo SET clasificacion_obs=$1,clasificacion_apoyo=$2,seriacion_obs=$3,seriacion_apoyo=$4,asimilacion_obs=$5,asimilacion_apoyo=$6,justificacion_obs=$7,justificacion_apoyo=$8,autorregulacion_obs=$9,autorregulacion_apoyo=$10,updated_at=now() WHERE alumno_id=$11 AND (unidad_id=$12 OR ($12 IS NULL AND unidad_id IS NULL)) RETURNING *`,
        [clasificacionObs, clasificacionApoyo, seriacionObs, seriacionApoyo, asimilacionObs,
         asimilacionApoyo, justificacionObs, justificacionApoyo, autorregulacionObs,
         autorregulacionApoyo, alumnoId, unidad]
      );
      return mapMonitoreo(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO monitoreo (alumno_id,unidad_id,clasificacion_obs,clasificacion_apoyo,seriacion_obs,seriacion_apoyo,asimilacion_obs,asimilacion_apoyo,justificacion_obs,justificacion_apoyo,autorregulacion_obs,autorregulacion_apoyo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [alumnoId, unidad, clasificacionObs, clasificacionApoyo, seriacionObs, seriacionApoyo,
       asimilacionObs, asimilacionApoyo, justificacionObs, justificacionApoyo,
       autorregulacionObs, autorregulacionApoyo]
    );
    return mapMonitoreo(result.rows[0]);
  }
}

class AutoevaluacionRepository {
  async find(docenteId, claseId, alumnoId, unidadId) {
    let result;
    if (alumnoId && isValidUuid(alumnoId) && unidadId && isValidUuid(unidadId)) {
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

  async upsert(docenteId, claseId, unidadId, alumnoId, respuestas) {
    const unidad = unidadId && isValidUuid(unidadId) ? unidadId : null;
    const alumno = alumnoId && isValidUuid(alumnoId) ? alumnoId : null;

    const exists = await pool.query(
      'SELECT id FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND alumno_id=$3 AND (unidad_id=$4 OR ($4 IS NULL AND unidad_id IS NULL))',
      [docenteId, claseId, alumno, unidad]
    );

    if (exists.rows.length > 0) {
      const result = await pool.query(
        'UPDATE autoevaluacion SET respuestas=$1 WHERE id=$2 RETURNING *',
        [JSON.stringify(respuestas), exists.rows[0].id]
      );
      return mapAutoevaluacion(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO autoevaluacion (docente_id,unidad_id,alumno_id,clase_id,respuestas) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [docenteId, unidad, alumno, claseId, JSON.stringify(respuestas)]
    );
    return mapAutoevaluacion(result.rows[0]);
  }
}

module.exports = {
  evaluacionRepository: new EvaluacionRepository(),
  monitoreoRepository: new MonitoreoRepository(),
  autoevaluacionRepository: new AutoevaluacionRepository()
};
