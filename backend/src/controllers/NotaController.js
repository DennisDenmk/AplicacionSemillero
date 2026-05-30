const notaRepository = require('../repositories/NotaRepository');
const { isValidUuid } = require('../domain/utils');

const NotaController = {
  async getAll(req, res) {
    const { claseId } = req.query;
    if (!claseId) return res.status(400).json({ error: 'claseId es requerido' });
    if (!isValidUuid(claseId)) return res.json([]);
    try {
      const notas = await notaRepository.findAllByClase(claseId);
      res.json(notas);
    } catch (err) {
      console.error('Error fetching notas:', err);
      res.status(500).json({ error: 'Error al obtener calificaciones' });
    }
  },

  async upsert(req, res) {
    const { alumnoId, tareaId, valor, comentario } = req.body;
    if (alumnoId === undefined || tareaId === undefined || valor === undefined) {
      return res.status(400).json({ error: 'alumnoId, tareaId y valor son requeridos' });
    }
    if (!isValidUuid(alumnoId)) return res.status(400).json({ error: 'Identificador de alumnoId no es válido' });

    const numericValue = parseFloat(valor);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
      return res.status(400).json({ error: 'La nota debe ser un número entre 0 y 10' });
    }
    try {
      await notaRepository.upsert(alumnoId, tareaId, numericValue, comentario);
      res.json({ message: 'Calificación guardada correctamente' });
    } catch (err) {
      console.error('Error saving nota:', err);
      res.status(500).json({ error: 'Error al registrar calificación en base de datos' });
    }
  }
};

module.exports = NotaController;
