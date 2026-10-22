const express = require('express');
const router = express.Router();
const { obtenerDias } = require('../controllers/diasController');

router.post('/', obtenerDias);

module.exports = router;
