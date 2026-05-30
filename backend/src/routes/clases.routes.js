const express = require('express');
const router = express.Router();
const ClaseController = require('../controllers/ClaseController');

router.get('/', ClaseController.getAll);
router.post('/', ClaseController.create);
router.delete('/:id', ClaseController.delete);

module.exports = router;
