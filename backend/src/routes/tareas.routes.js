const express = require('express');
const router = express.Router();
const TareaController = require('../controllers/TareaController');

router.get('/', TareaController.getAll);
router.post('/', TareaController.create);
router.put('/:id', TareaController.update);
router.delete('/:id', TareaController.delete);

module.exports = router;
