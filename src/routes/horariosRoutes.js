const express = require('express');
const router = express.Router();
const { obtenerHorarios } = require('../controllers/horariosController');

router.post('/', obtenerHorarios);

module.exports = router;
