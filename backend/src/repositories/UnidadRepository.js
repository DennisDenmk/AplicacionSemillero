const { pool } = require('../infrastructure/database/postgres');
const { mapUnidad } = require('../domain/models');

class UnidadRepository {
  async findAllByClase(claseId) {
    const result = await pool.query(
      'SELECT * FROM unidades WHERE clase_id = $1 ORDER BY created_at ASC',
      [claseId]
    );
    return result.rows.map(mapUnidad);
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM unidades WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapUnidad(result.rows[0]) : null;
  }

  async create(data) {
    const { claseId, titulo, ambito, objetivoGeneral, objetivoAprendizaje, destrezas,
      semanasPrevistas, descripcionActividades, imagenUrl, tecnicasDidacticas,
      criteriosEvaluacion, materiales } = data;

    const result = await pool.query(
      `INSERT INTO unidades (clase_id,titulo,ambito,objetivo_general,objetivo_aprendizaje,destrezas,semanas_previstas,descripcion_actividades,imagen_url,tecnicas_didacticas,criterios_evaluacion,materiales)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [claseId, titulo, ambito || null, objetivoGeneral || null, objetivoAprendizaje || null,
       destrezas || null, semanasPrevistas || 1, descripcionActividades || null,
       imagenUrl || null, tecnicasDidacticas || null, criteriosEvaluacion || null,
       JSON.stringify(materiales || [])]
    );
    return mapUnidad(result.rows[0]);
  }

  async update(id, data) {
    const { titulo, ambito, objetivoGeneral, objetivoAprendizaje, destrezas, semanasPrevistas,
      descripcionActividades, imagenUrl, tecnicasDidacticas, criteriosEvaluacion, materiales, archivada } = data;

    const result = await pool.query(
      `UPDATE unidades SET titulo=$1,ambito=$2,objetivo_general=$3,objetivo_aprendizaje=$4,destrezas=$5,semanas_previstas=$6,descripcion_actividades=$7,imagen_url=$8,tecnicas_didacticas=$9,criterios_evaluacion=$10,materiales=$11,archivada=$12,updated_at=now() WHERE id=$13 RETURNING *`,
      [titulo, ambito || null, objetivoGeneral || null, objetivoAprendizaje || null,
       destrezas || null, semanasPrevistas || 1, descripcionActividades || null,
       imagenUrl || null, tecnicasDidacticas || null, criteriosEvaluacion || null,
       JSON.stringify(materiales || []), archivada === true, id]
    );
    return result.rows.length > 0 ? mapUnidad(result.rows[0]) : null;
  }

  async delete(id) {
    await pool.query('DELETE FROM unidades WHERE id = $1', [id]);
  }

  async clone(id) {
    const orig = await pool.query('SELECT * FROM unidades WHERE id = $1', [id]);
    if (orig.rows.length === 0) return null;
    const u = orig.rows[0];
    const result = await pool.query(
      `INSERT INTO unidades (clase_id,titulo,ambito,objetivo_general,objetivo_aprendizaje,destrezas,semanas_previstas,descripcion_actividades,imagen_url,tecnicas_didacticas,criterios_evaluacion,materiales)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [u.clase_id, u.titulo + ' (Copia)', u.ambito, u.objetivo_general, u.objetivo_aprendizaje,
       u.destrezas, u.semanas_previstas, u.descripcion_actividades, u.imagen_url,
       u.tecnicas_didacticas, u.criterios_evaluacion, u.materiales]
    );
    return mapUnidad(result.rows[0]);
  }
}

module.exports = new UnidadRepository();
