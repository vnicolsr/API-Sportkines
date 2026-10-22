/**
 * Resolutor dinámico de empresas/sucursales.
 *
 * En lugar de un mapeo hardcodeado ciudad→empresaId,
 * consulta la API /obtener_empresas_usuario y cachea el resultado.
 * Luego resuelve el empresaId buscando por nombreComercial.
 */

const { obtenerEmpresas } = require('../services/sportkinesService');
const { logger } = require('../utils/logger');

// Cache en memoria de las empresas
let empresasCache = [];
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

/**
 * Obtiene las empresas, usando cache si está vigente.
 * @returns {Promise<Array>} Lista de empresas
 */
async function getEmpresas() {
  const now = Date.now();

  if (empresasCache.length > 0 && (now - lastFetch) < CACHE_TTL) {
    return empresasCache;
  }

  try {
    const data = await obtenerEmpresas();
    empresasCache = Array.isArray(data) ? data
      : data.payload || data.empresas || data.data || [];
    lastFetch = now;
    logger.info(`Cache de empresas actualizado: ${empresasCache.length} sucursales`);
  } catch (error) {
    logger.error('Error al obtener empresas:', error.message);
    // Si falla pero tenemos cache viejo, usarlo
    if (empresasCache.length > 0) {
      logger.warn('Usando cache anterior de empresas');
    }
  }

  return empresasCache;
}

/**
 * Busca una empresa por nombreComercial (comparación flexible).
 *
 * @param {string} nombreComercial - Valor que viene de Manychat
 * @returns {Promise<Object|null>} Empresa encontrada o null
 */
async function findEmpresaByNombre(nombreComercial) {
  if (!nombreComercial) return null;

  const empresas = await getEmpresas();
  const needle = normalize(nombreComercial);

  // Búsqueda exacta normalizada
  let found = empresas.find(e => normalize(e.nombreComercial) === needle);
  if (found) return found;

  // Búsqueda parcial (el nombre del botón puede ser más corto)
  found = empresas.find(e =>
    normalize(e.nombreComercial).includes(needle) ||
    needle.includes(normalize(e.nombreComercial))
  );
  if (found) return found;

  // Búsqueda por razonSocial como fallback
  found = empresas.find(e =>
    normalize(e.razonSocial).includes(needle) ||
    needle.includes(normalize(e.razonSocial))
  );

  return found || null;
}

/**
 * Normaliza string para comparación: mayúsculas, sin acentos, sin espacios extra.
 */
function normalize(str) {
  return String(str || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Fuerza recarga del cache (útil si se agregan sucursales).
 */
function invalidateCache() {
  lastFetch = 0;
  empresasCache = [];
}

module.exports = {
  getEmpresas,
  findEmpresaByNombre,
  invalidateCache
};
