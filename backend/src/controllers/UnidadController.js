const unidadRepository = require('../repositories/UnidadRepository');
const { isValidUuid } = require('../domain/utils');

const UnidadController = {
  async getAll(req, res) {
    const { claseId } = req.query;
    if (!claseId) return res.status(400).json({ error: 'claseId es obligatorio' });
    if (!isValidUuid(claseId)) return res.json([]);
    try {
      const unidades = await unidadRepository.findAllByClase(claseId);
      res.json(unidades);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async create(req, res) {
    const userId = req.headers['user-id'];
    if (!userId || !isValidUuid(userId)) return res.status(401).json({ error: 'No autorizado' });
    const { claseId, titulo } = req.body;
    if (!claseId || !titulo) return res.status(400).json({ error: 'claseId y titulo son requeridos' });
    if (!isValidUuid(claseId)) return res.status(400).json({ error: 'claseId inválido' });
    try {
      const unidad = await unidadRepository.create(req.body);
      res.status(201).json(unidad);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async update(req, res) {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(404).json({ error: 'Unidad no encontrada' });
    try {
      const unidad = await unidadRepository.update(id, req.body);
      if (!unidad) return res.status(404).json({ error: 'Unidad no encontrada' });
      res.json(unidad);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async delete(req, res) {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(404).json({ error: 'Unidad no encontrada' });
    try {
      await unidadRepository.delete(id);
      res.json({ message: 'Unidad eliminada' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async clone(req, res) {
    const { id } = req.params;
    if (!isValidUuid(id)) return res.status(404).json({ error: 'Unidad no encontrada' });
    try {
      const unidad = await unidadRepository.clone(id);
      if (!unidad) return res.status(404).json({ error: 'Unidad no encontrada' });
      res.status(201).json(unidad);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
};

module.exports = UnidadController;
