const { pool } = require('../infrastructure/database/postgres');
const { mapClase } = require('../domain/models');

class ClaseRepository {
  async findAllByDocente(docenteId) {
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM alumnos a WHERE a.clase_id = c.id) as num_alumnos,
        (SELECT json_agg(a.nombre) FROM (SELECT nombre FROM alumnos a2 WHERE a2.clase_id = c.id LIMIT 4) a) as alumnos_nombres
       FROM clases c 
       WHERE c.docente_id = $1 ORDER BY c.created_at DESC`,
      [docenteId]
    );
    return result.rows.map(mapClase);
  }

  async findByIdAndDocente(id, docenteId) {
    const result = await pool.query(
      'SELECT * FROM clases WHERE id = $1 AND docente_id = $2',
      [id, docenteId]
    );
    return result.rows.length > 0 ? mapClase(result.rows[0]) : null;
  }

  async create(nombre, grado, docenteId) {
    const result = await pool.query(
      'INSERT INTO clases (nombre, grado, docente_id) VALUES ($1, $2, $3) RETURNING *',
      [nombre, grado, docenteId]
    );
    return mapClase(result.rows[0]);
  }

  async delete(id) {
    await pool.query('DELETE FROM clases WHERE id = $1', [id]);
  }
}

module.exports = new ClaseRepository();
