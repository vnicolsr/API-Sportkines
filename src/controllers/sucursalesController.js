/**
 * Controller: Resolver Sucursal
 *
 * Recibe el nombreComercial desde Manychat,
 * lo compara contra el servicio obtener_empresas,
 * y devuelve el id.
 *
 * POST /resolver-sucursal
 *   Body: { sucursal_seleccionada: "Sportkines Angeles" }
 *   Response: { empresa_id: 1 }
 *
 * Response Mapping en Manychat:
 *   $.empresa_id → empresa_id
 */

const { obtenerEmpresas } = require('../services/sportkinesService');
const { logger } = require('../utils/logger');

const normalize = (str) => String(str).trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function resolverSucursal(req, res) {
  try {
    const nombre = req.body.sucursal_seleccionada || '';

    if (!nombre) {
      return res.json({ error: true, empresa_id: '', message: 'No se recibió la sucursal' });
    }

    const data = await obtenerEmpresas();
    const empresas = Array.isArray(data) ? data
      : data.payload || data.empresas || data.data || [];

    const target = normalize(nombre);

    // Match exacto
    let empresa = empresas.find(e => normalize(e.nombreComercial) === target);

    // Si no, match parcial
    if (!empresa) {
      empresa = empresas.find(e =>
        normalize(e.nombreComercial).includes(target) ||
        target.includes(normalize(e.nombreComercial))
      );
    }

    if (!empresa) {
      logger.warn(`Sucursal no encontrada: "${nombre}"`);
      return res.json({ error: true, empresa_id: '', message: `Sucursal "${nombre}" no encontrada` });
    }

    logger.info(`Sucursal "${nombre}" → empresa_id: ${empresa.id}`);
    return res.json({ empresa_id: empresa.id });
  } catch (error) {
    logger.error('Error en resolverSucursal:', error.message);
    return res.status(500).json({ error: true, empresa_id: '', message: 'Error al resolver sucursal' });
  }
}

module.exports = { resolverSucursal };
