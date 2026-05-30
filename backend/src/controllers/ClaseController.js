const claseRepository = require('../repositories/ClaseRepository');
const tareaRepository = require('../repositories/TareaRepository');
const { isValidUuid } = require('../domain/utils');
const path = require('path');

const ClaseController = {
  async getAll(req, res) {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    if (!isValidUuid(userId)) return res.json([]);
    try {
      const clases = await claseRepository.findAllByDocente(userId);
      res.json(clases);
    } catch (err) {
      console.error('Error fetching clases:', err);
      res.status(500).json({ error: 'Error al consultar aulas en base de datos' });
    }
  },

  async create(req, res) {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    if (!isValidUuid(userId)) return res.status(400).json({ error: 'Identificador de docente no válido' });

    const { nombre, grado } = req.body;
    if (!nombre || !grado) return res.status(400).json({ error: 'Nombre y grado son requeridos' });

    try {
      const clase = await claseRepository.create(nombre, grado, userId);
      res.status(201).json(clase);
    } catch (err) {
      console.error('Error creating clase:', err);
      res.status(500).json({ error: 'Error al crear aula en PostgreSQL' });
    }
  },

  async delete(req, res) {
    const userId = req.headers['user-id'];
    const claseId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    if (!isValidUuid(userId) || !isValidUuid(claseId)) {
      return res.status(404).json({ error: 'Clase no encontrada o identificador inválido' });
    }
    try {
      const clase = await claseRepository.findByIdAndDocente(claseId, userId);
      if (!clase) return res.status(404).json({ error: 'Clase no encontrada o no pertenece al usuario' });

      // Delete task files from disk before DB cascade
      const tareas = await tareaRepository.findAllByClase(claseId);
      const publicDir = path.join(__dirname, '..', '..', 'public');
      tareas.forEach(t => tareaRepository.deleteFiles(t, publicDir));

      await claseRepository.delete(claseId);
      res.json({ message: 'Clase y todos sus datos relacionados eliminados' });
    } catch (err) {
      console.error('Error deleting clase:', err);
      res.status(500).json({ error: 'Error al eliminar la clase en base de datos' });
    }
  }
};

module.exports = ClaseController;
