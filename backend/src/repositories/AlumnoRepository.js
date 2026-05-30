const { pool } = require('../infrastructure/database/postgres');
const { mapAlumno } = require('../domain/models');

class AlumnoRepository {
  async findAllByClase(claseId) {
    const result = await pool.query(
      'SELECT * FROM alumnos WHERE clase_id = $1 ORDER BY nombre ASC',
      [claseId]
    );
    return result.rows.map(mapAlumno);
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM alumnos WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapAlumno(result.rows[0]) : null;
  }

  async create(claseId, nombre, padreCorreo, representante, telefono) {
    const result = await pool.query(
      'INSERT INTO alumnos (clase_id, nombre, padre_correo, representante, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claseId, nombre, padreCorreo, representante || null, telefono || null]
    );
    return mapAlumno(result.rows[0]);
  }

  async update(id, nombre, padreCorreo, representante, telefono) {
    const result = await pool.query(
      'UPDATE alumnos SET nombre=$1, padre_correo=$2, representante=$3, telefono=$4 WHERE id=$5 RETURNING *',
      [nombre, padreCorreo, representante || null, telefono || null, id]
    );
    return result.rows.length > 0 ? mapAlumno(result.rows[0]) : null;
  }

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM alumnos WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows.length > 0;
  }
}

module.exports = new AlumnoRepository();
