const express = require('express');
const router = express.Router();
const { EvaluacionController, MonitoreoController, AutoevaluacionController, MatrizController } = require('../controllers/EvaluacionController');

// Evaluaciones
router.get('/evaluaciones', EvaluacionController.getAll);
router.post('/evaluaciones', EvaluacionController.create);

// Monitoreo
router.get('/monitoreo/:alumnoId', MonitoreoController.getByAlumno);
router.post('/monitoreo', MonitoreoController.upsert);

// Autoevaluación
router.get('/autoevaluacion', AutoevaluacionController.getAll);
router.post('/autoevaluacion', AutoevaluacionController.create);

// Matriz consolidada
router.get('/evaluaciones-matriz/:claseId/:unidadId', MatrizController.getMatriz);

module.exports = router;
