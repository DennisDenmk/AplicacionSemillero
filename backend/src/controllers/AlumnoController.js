const alumnoRepository = require('../repositories/AlumnoRepository');
const { isValidUuid } = require('../domain/utils');

const AlumnoController = {
  async getAll(req, res) {
    const { claseId } = req.query;
    if (!claseId) return res.status(400).json({ error: 'claseId es obligatorio' });
    if (!isValidUuid(claseId)) return res.json([]);
    try {
      const alumnos = await alumnoRepository.findAllByClase(claseId);
      res.json(alumnos);
    } catch (err) {
      console.error('Error fetching alumnos:', err);
      res.status(500).json({ error: 'Error al consultar alumnos' });
    }
  },

  async create(req, res) {
    const { claseId, nombre, padreCorreo, representante, telefono } = req.body;
    if (!claseId || !nombre || !padreCorreo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (!isValidUuid(claseId)) return res.status(400).json({ error: 'Identificador claseId no válido' });
    try {
      const alumno = await alumnoRepository.create(claseId, nombre, padreCorreo, representante, telefono);
      res.status(201).json(alumno);
    } catch (err) {
      console.error('Error creating alumno:', err);
      res.status(500).json({ error: 'Error al registrar alumno en base de datos' });
    }
  },

  async update(req, res) {
    const alumnoId = req.params.id;
    const { nombre, padreCorreo, representante, telefono } = req.body;
    if (!nombre || !padreCorreo) return res.status(400).json({ error: 'nombre y padreCorreo son obligatorios' });
    if (!isValidUuid(alumnoId)) return res.status(404).json({ error: 'Alumno no encontrado o ID inválido' });
    try {
      const alumno = await alumnoRepository.update(alumnoId, nombre, padreCorreo, representante, telefono);
      if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
      res.json(alumno);
    } catch (err) {
      console.error('Error updating alumno:', err);
      res.status(500).json({ error: 'Error al actualizar alumno' });
    }
  },

  async delete(req, res) {
    const alumnoId = req.params.id;
    if (!isValidUuid(alumnoId)) return res.status(404).json({ error: 'Alumno no encontrado o ID inválido' });
    try {
      const deleted = await alumnoRepository.delete(alumnoId);
      if (!deleted) return res.status(404).json({ error: 'Alumno no encontrado' });
      res.json({ message: 'Alumno y calificaciones asociadas eliminados' });
    } catch (err) {
      console.error('Error deleting alumno:', err);
      res.status(500).json({ error: 'Error al eliminar alumno' });
    }
  }
};

module.exports = AlumnoController;
