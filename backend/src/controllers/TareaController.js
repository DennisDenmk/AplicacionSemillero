const tareaRepository = require('../repositories/TareaRepository');
const { isValidUuid } = require('../domain/utils');
const path = require('path');

const TareaController = {
  /** GET /api/tareas?unidadId=... OR ?claseId=... */
  async getAll(req, res) {
    const { unidadId, claseId } = req.query;

    // Modo principal: filtrar por unidad
    if (unidadId) {
      if (!isValidUuid(unidadId)) return res.json([]);
      try {
        const tareas = await tareaRepository.findAllByUnidad(unidadId);
        return res.json(tareas);
      } catch (err) {
        console.error('Error fetching tareas by unidad:', err);
        return res.status(500).json({ error: 'Error al obtener tareas' });
      }
    }

    // Modo legacy / notas: filtrar por clase (todas las tareas del aula)
    if (claseId) {
      if (!isValidUuid(claseId)) return res.json([]);
      try {
        const tareas = await tareaRepository.findAllByClase(claseId);
        return res.json(tareas);
      } catch (err) {
        console.error('Error fetching tareas by clase:', err);
        return res.status(500).json({ error: 'Error al obtener tareas' });
      }
    }

    return res.status(400).json({ error: 'Se requiere unidadId o claseId como parámetro' });
  },

  /** POST /api/tareas  — body: { claseId, unidadId, titulo, imagenUrl, actividadTipo, detalles, materiales } */
  async create(req, res) {
    const { claseId, unidadId, titulo, imagenUrl, actividadTipo, detalles, materiales } = req.body;
    if (!claseId || !unidadId || !titulo || !imagenUrl || !actividadTipo || !detalles) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (claseId, unidadId, titulo, imagenUrl, actividadTipo, detalles)' });
    }
    if (!isValidUuid(claseId)) return res.status(400).json({ error: 'Identificador claseId no válido' });
    if (!isValidUuid(unidadId)) return res.status(400).json({ error: 'Identificador unidadId no válido' });
    try {
      const tarea = await tareaRepository.create(claseId, unidadId, titulo, imagenUrl, actividadTipo, detalles, materiales);
      res.status(201).json(tarea);
    } catch (err) {
      console.error('Error creating tarea:', err);
      res.status(500).json({ error: 'Error al registrar la tarea' });
    }
  },

  async update(req, res) {
    const tareaId = req.params.id;
    const { titulo, imagenUrl, actividadTipo, detalles, materiales } = req.body;
    if (!titulo || !imagenUrl || !actividadTipo || !detalles) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!isValidUuid(tareaId)) return res.status(404).json({ error: 'Tarea no encontrada' });

    try {
      const oldTarea = await tareaRepository.findById(tareaId);
      if (!oldTarea) return res.status(404).json({ error: 'Tarea no encontrada' });

      const publicDir = path.join(__dirname, '..', '..', 'public');
      const newMaterials = materiales || [];

      // Limpiar archivos eliminados del disco
      (oldTarea.materiales || []).forEach(origMat => {
        const isStillPresent = newMaterials.some(m => m.archivoUrl === origMat.archivoUrl);
        if (!isStillPresent && origMat.archivoUrl && origMat.archivoUrl.startsWith('/uploads/') &&
            !origMat.archivoUrl.includes('lamina_alimentos')) {
          const { existsSync, unlinkSync } = require('fs');
          const fullPath = path.join(publicDir, origMat.archivoUrl);
          if (existsSync(fullPath)) try { unlinkSync(fullPath); } catch (e) { /* ignore */ }
        }
      });
      if (oldTarea.imagenUrl !== imagenUrl && oldTarea.imagenUrl.startsWith('/uploads/') &&
          !oldTarea.imagenUrl.includes('tarea_frutas') && !oldTarea.imagenUrl.includes('tarea_rutina')) {
        const { existsSync, unlinkSync } = require('fs');
        const fullPath = path.join(publicDir, oldTarea.imagenUrl);
        if (existsSync(fullPath)) try { unlinkSync(fullPath); } catch (e) { /* ignore */ }
      }

      const updated = await tareaRepository.update(tareaId, titulo, imagenUrl, actividadTipo, detalles, newMaterials);
      res.json(updated);
    } catch (err) {
      console.error('Error updating tarea:', err);
      res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
  },

  async delete(req, res) {
    const tareaId = req.params.id;
    if (!isValidUuid(tareaId)) return res.status(404).json({ error: 'Tarea no encontrada o ID inválido' });
    try {
      const tarea = await tareaRepository.findById(tareaId);
      if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });

      const publicDir = path.join(__dirname, '..', '..', 'public');
      tareaRepository.deleteFiles(tarea, publicDir);
      await tareaRepository.delete(tareaId);
      res.json({ message: 'Tarea y archivos asociados eliminados' });
    } catch (err) {
      console.error('Error deleting tarea:', err);
      res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
  }
};

module.exports = TareaController;
