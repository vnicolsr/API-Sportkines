const express = require('express');
const router = express.Router();
const { resolverSucursal } = require('../controllers/sucursalesController');

router.post('/', resolverSucursal);

module.exports = router;
