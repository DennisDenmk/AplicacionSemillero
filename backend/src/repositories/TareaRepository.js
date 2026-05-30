const { pool } = require('../infrastructure/database/postgres');
const { mapTarea } = require('../domain/models');
const path = require('path');
const fs = require('fs');

class TareaRepository {
  /** Obtener todas las tareas de una unidad específica */
  async findAllByUnidad(unidadId) {
    const result = await pool.query(
      'SELECT * FROM tareas WHERE unidad_id = $1 ORDER BY created_at ASC',
      [unidadId]
    );
    return result.rows.map(mapTarea);
  }

  /** Fallback: obtener todas las tareas de una clase (para notas) */
  async findAllByClase(claseId) {
    const result = await pool.query(
      'SELECT * FROM tareas WHERE clase_id = $1 ORDER BY created_at ASC',
      [claseId]
    );
    return result.rows.map(mapTarea);
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM tareas WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapTarea(result.rows[0]) : null;
  }

  async create(claseId, unidadId, titulo, imagenUrl, actividadTipo, detalles, materiales) {
    const result = await pool.query(
      'INSERT INTO tareas (clase_id, unidad_id, titulo, imagen_url, actividad_tipo, detalles, materiales) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [claseId, unidadId || null, titulo, imagenUrl, actividadTipo, JSON.stringify(detalles), JSON.stringify(materiales || [])]
    );
    return mapTarea(result.rows[0]);
  }

  async update(id, titulo, imagenUrl, actividadTipo, detalles, materiales) {
    const result = await pool.query(
      'UPDATE tareas SET titulo=$1, imagen_url=$2, actividad_tipo=$3, detalles=$4, materiales=$5 WHERE id=$6 RETURNING *',
      [titulo, imagenUrl, actividadTipo, JSON.stringify(detalles), JSON.stringify(materiales || []), id]
    );
    return result.rows.length > 0 ? mapTarea(result.rows[0]) : null;
  }

  async delete(id) {
    const result = await pool.query('DELETE FROM tareas WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  /** Deletes associated files from the disk when a task is removed. */
  deleteFiles(task, publicDir) {
    if (task.imagenUrl && task.imagenUrl.startsWith('/uploads/') &&
        !task.imagenUrl.includes('tarea_frutas') && !task.imagenUrl.includes('tarea_rutina')) {
      const fullPath = path.join(publicDir, task.imagenUrl);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (err) { console.error('Error deleting image:', err); }
      }
    }
    if (task.materiales && Array.isArray(task.materiales)) {
      task.materiales.forEach(mat => {
        if (mat.archivoUrl && mat.archivoUrl.startsWith('/uploads/') && !mat.archivoUrl.includes('lamina_alimentos')) {
          const fullPath = path.join(publicDir, mat.archivoUrl);
          if (fs.existsSync(fullPath)) {
            try { fs.unlinkSync(fullPath); } catch (err) { console.error('Error deleting material:', err); }
          }
        }
      });
    }
  }
}

module.exports = new TareaRepository();
