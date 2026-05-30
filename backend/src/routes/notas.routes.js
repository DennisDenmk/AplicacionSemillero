const express = require('express');
const router = express.Router();
const NotaController = require('../controllers/NotaController');

router.get('/', NotaController.getAll);
router.post('/', NotaController.upsert);

module.exports = router;
