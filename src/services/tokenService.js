/**
 * Servicio de persistencia de token.
 *
 * Implementa un singleton en memoria que almacena el Bearer Token
 * de la API Sportkines. Usa node-cron para refrescarlo automáticamente
 * cada 4 horas (configurable via TOKEN_REFRESH_HOURS).
 *
 * ── FLUJO ──
 * 1. Al iniciar el servidor, se llama initTokenRefresh()
 * 2. Se obtiene el token por primera vez (POST /obtener_token)
 * 3. Se programa un cron job que lo renueva cada N horas
 * 4. Cualquier módulo obtiene el token actual con getToken()
 */

const axios = require('axios');
const cron = require('node-cron');
const { logger } = require('../utils/logger');

// ── Singleton: Token en memoria ──
let currentToken = null;
let tokenExpiresAt = null;

const API_BASE = process.env.API_BASE_URL;
const API_EMAIL = process.env.API_EMAIL;
const API_PASSWORD = process.env.API_PASSWORD;
const REFRESH_HOURS = parseInt(process.env.TOKEN_REFRESH_HOURS, 10) || 4;

/**
 * Solicita un nuevo token a la API.
 */
async function fetchToken() {
  try {
    const response = await axios.post(`${API_BASE}/obtener_token`, {
      correo: API_EMAIL,
      password: API_PASSWORD
    });

    // La API devuelve: { error: false, msg: "eyJ...", payload: {...} }
    const token = response.data.msg
      || response.data.token
      || response.data.accessToken
      || response.data.data?.token;

    if (!token || typeof token !== 'string') {
      throw new Error(`Respuesta inesperada al obtener token: ${JSON.stringify(response.data)}`);
    }

    currentToken = token;
    tokenExpiresAt = new Date(Date.now() + REFRESH_HOURS * 60 * 60 * 1000);

    logger.info(`Token renovado. Válido hasta: ${tokenExpiresAt.toISOString()}`);
    return token;
  } catch (error) {
    logger.error('Error al obtener token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Inicializa el servicio: obtiene el token y programa el cron.
 */
async function initTokenRefresh() {
  // Obtener token inicial
  await fetchToken();

  // Programar renovación con cron
  // Ejemplo para cada 4 horas: '0 */4 * * *'
  const cronExpression = `0 */${REFRESH_HOURS} * * *`;

  cron.schedule(cronExpression, async () => {
    logger.info('Cron: Renovando token...');
    try {
      await fetchToken();
    } catch (err) {
      logger.error('Cron: Fallo al renovar token. Se reintentará en la próxima ejecución.');
    }
  });

  logger.info(`Cron programado: renovar token cada ${REFRESH_HOURS} horas (${cronExpression})`);
}

/**
 * Devuelve el token actual. Si está vencido o no existe, lo renueva.
 * @returns {Promise<string>} Bearer token
 */
async function getToken() {
  if (!currentToken || (tokenExpiresAt && new Date() >= tokenExpiresAt)) {
    logger.warn('Token vencido o inexistente. Renovando...');
    await fetchToken();
  }
  return currentToken;
}

/**
 * Crea los headers de autorización para llamadas a la API.
 * @returns {Promise<Object>} Headers con Authorization
 */
async function getAuthHeaders() {
  const token = await getToken();
  return {
    'Authorization': token,
    'Content-Type': 'application/json'
  };
}

module.exports = {
  initTokenRefresh,
  getToken,
  getAuthHeaders
};
