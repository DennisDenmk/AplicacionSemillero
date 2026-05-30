const express = require('express');
const router = express.Router();
const UnidadController = require('../controllers/UnidadController');

router.get('/', UnidadController.getAll);
router.post('/', UnidadController.create);
router.put('/:id', UnidadController.update);
router.delete('/:id', UnidadController.delete);
router.post('/:id/clonar', UnidadController.clone);

module.exports = router;
