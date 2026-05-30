const { pool } = require('../infrastructure/database/postgres');
const { mapNota } = require('../domain/models');

class NotaRepository {
  async findAllByClase(claseId) {
    const result = await pool.query(
      `SELECT n.* FROM notas n 
       INNER JOIN alumnos a ON n.alumno_id = a.id 
       WHERE a.clase_id = $1 
       ORDER BY n.created_at ASC`,
      [claseId]
    );
    return result.rows.map(mapNota);
  }

  async upsert(alumnoId, tareaId, valor, comentario) {
    const check = await pool.query(
      'SELECT id FROM notas WHERE alumno_id = $1 AND tarea_id = $2',
      [alumnoId, tareaId]
    );
    if (check.rows.length > 0) {
      await pool.query(
        'UPDATE notas SET valor = $1, comentario = $2 WHERE alumno_id = $3 AND tarea_id = $4',
        [valor, comentario || '', alumnoId, tareaId]
      );
    } else {
      await pool.query(
        'INSERT INTO notas (alumno_id, tarea_id, valor, comentario) VALUES ($1, $2, $3, $4)',
        [alumnoId, tareaId, valor, comentario || '']
      );
    }
  }
}

module.exports = new NotaRepository();
