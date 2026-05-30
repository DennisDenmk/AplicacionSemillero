const { evaluacionRepository, monitoreoRepository, autoevaluacionRepository } = require('../repositories/EvaluacionRepository');
const { pool } = require('../infrastructure/database/postgres');
const { isValidUuid } = require('../domain/utils');

const EvaluacionController = {
  async getAll(req, res) {
    const { claseId, alumnoId } = req.query;
    if (!claseId && !alumnoId) return res.status(400).json({ error: 'claseId o alumnoId requerido' });
    try {
      let data;
      if (alumnoId && isValidUuid(alumnoId)) {
        data = await evaluacionRepository.findAllByAlumno(alumnoId);
      } else if (claseId && isValidUuid(claseId)) {
        data = await evaluacionRepository.findAllByClase(claseId);
      } else { return res.json([]); }
      res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async create(req, res) {
    const { alumnoId, unidadId, claseId, rubrica, notaEscrita } = req.body;
    if (!alumnoId || !claseId || !rubrica) return res.status(400).json({ error: 'alumnoId, claseId y rubrica son requeridos' });
    if (!isValidUuid(alumnoId) || !isValidUuid(claseId)) return res.status(400).json({ error: 'IDs inválidos' });
    try {
      const evaluacion = await evaluacionRepository.create(alumnoId, unidadId, claseId, rubrica, notaEscrita);
      res.status(201).json(evaluacion);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
};

const MonitoreoController = {
  async getByAlumno(req, res) {
    const { alumnoId } = req.params;
    const { unidadId } = req.query;
    if (!isValidUuid(alumnoId)) return res.status(400).json({ error: 'alumnoId inválido' });
    try {
      const monitoreo = await monitoreoRepository.findByAlumno(alumnoId, unidadId);
      res.json(monitoreo);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async upsert(req, res) {
    const { alumnoId } = req.body;
    if (!alumnoId || !isValidUuid(alumnoId)) return res.status(400).json({ error: 'alumnoId inválido' });
    try {
      const monitoreo = await monitoreoRepository.upsert(req.body);
      const isNew = !req.body.id;
      res.status(isNew ? 201 : 200).json(monitoreo);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
};

const AutoevaluacionController = {
  async getAll(req, res) {
    const userId = req.headers['user-id'];
    const { claseId, alumnoId, unidadId } = req.query;
    if (!userId || !isValidUuid(userId)) return res.status(401).json({ error: 'No autorizado' });
    if (!claseId || !isValidUuid(claseId)) return res.json([]);
    try {
      const data = await autoevaluacionRepository.find(userId, claseId, alumnoId, unidadId);
      res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async create(req, res) {
    const userId = req.headers['user-id'];
    if (!userId || !isValidUuid(userId)) return res.status(401).json({ error: 'No autorizado' });
    const { claseId, unidadId, alumnoId, respuestas } = req.body;
    if (!claseId || !respuestas) return res.status(400).json({ error: 'claseId y respuestas son requeridos' });
    if (!isValidUuid(claseId)) return res.status(400).json({ error: 'claseId inválido' });
    try {
      const result = await autoevaluacionRepository.upsert(userId, claseId, unidadId, alumnoId, respuestas);
      res.status(201).json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
};

const MatrizController = {
  async getMatriz(req, res) {
    const userId = req.headers['user-id'];
    const { claseId, unidadId } = req.params;
    if (!isValidUuid(claseId) || !isValidUuid(unidadId)) return res.status(400).json({ error: 'IDs inválidos' });
    try {
      const { pool: db } = require('../infrastructure/database/postgres');
      const alumnos = await db.query('SELECT id, nombre FROM alumnos WHERE clase_id=$1 ORDER BY nombre', [claseId]);
      const evaluaciones = await db.query('SELECT alumno_id FROM evaluaciones WHERE clase_id=$1 AND unidad_id=$2', [claseId, unidadId]);
      const monitoreos = await db.query('SELECT alumno_id FROM monitoreo WHERE unidad_id=$1', [unidadId]);
      const autoevals = await db.query('SELECT alumno_id FROM autoevaluacion WHERE clase_id=$1 AND unidad_id=$2 AND docente_id=$3', [claseId, unidadId, userId]);

      const evalSet = new Set(evaluaciones.rows.map(r => r.alumno_id));
      const monSet  = new Set(monitoreos.rows.map(r => r.alumno_id));
      const autoSet = new Set(autoevals.rows.map(r => r.alumno_id));

      const matriz = alumnos.rows.map(a => ({
        alumnoId: a.id,
        nombre: a.nombre,
        rubrica: evalSet.has(a.id),
        monitoreo: monSet.has(a.id),
        autoeval: autoSet.has(a.id),
      }));
      res.json(matriz);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
};

module.exports = { EvaluacionController, MonitoreoController, AutoevaluacionController, MatrizController };
