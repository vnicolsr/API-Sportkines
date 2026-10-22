const express = require('express');
const router = express.Router();
const { confirmarCita } = require('../controllers/citaController');

router.post('/', confirmarCita);

module.exports = router;
