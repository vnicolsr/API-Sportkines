const axios = require('axios');
const { getAuthHeaders, getToken } = require('./tokenService');
const { logger } = require('../utils/logger');

const API_BASE = process.env.API_BASE_URL;

async function apiCall(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`;
  const makeRequest = async () => {
    const headers = await getAuthHeaders();
    const config = { method, url, headers };
    if (data) config.data = data;
    return axios(config);
  };

  try {
    const response = await makeRequest();
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      logger.warn('Token rechazado (401). Renovando...');
      await getToken();
      try {
        const retryResponse = await makeRequest();
        return retryResponse.data;
      } catch (retryError) {
        logger.error('Reintento fallido:', retryError.response?.data || retryError.message);
        throw retryError;
      }
    }
    logger.error(`API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
}

async function obtenerEmpresas() { return apiCall('GET', '/obtener_empresas_usuario'); }
async function obtenerTerapias() { return apiCall('GET', '/obtener_terapias'); }
async function obtenerCitas() { return apiCall('GET', '/obtener_citas'); }
async function obtenerDoctores() { return apiCall('GET', '/obtener_doctores'); }
async function obtenerFuentes() { return apiCall('GET', '/obtener_fuentes'); }

async function obtenerHorariosDisponibles(empresaId, fecha) {
  return apiCall('POST', '/obtener_horarios_disponibles', { empresaId, fecha });
}

/**
 * Registra cliente. Si ya existe (400), intenta extraer su id.
 * Maneja ambos formatos de error de la API:
 *   - "El cliente con el telefono X ya existe" + payload con id
 *   - "Ya existe un cliente registrado con el teléfono X." + payload sin id
 */
async function registrarCliente(clienteData) {
  try {
    const result = await apiCall('POST', '/registrar_cliente', clienteData);
    const id = result.payload?.id || result.id || result.clienteId;
    return { clienteId: id, existente: false, data: result };
  } catch (error) {
    const errorData = error.response?.data;
    const status = error.response?.status;
    const msg = errorData?.msg || '';

    logger.info('registrarCliente error completo:', JSON.stringify(errorData));

    // Detectar si el error es de cliente duplicado (cualquier formato)
    const esDuplicado = status === 400 && (
      msg.includes('ya existe') ||
      msg.includes('Ya existe')
    );

    if (esDuplicado) {
      // Intentar extraer el id de varias ubicaciones posibles
      const clienteId = errorData?.payload?.id
        || errorData?.payload?.clienteId
        || errorData?.id
        || errorData?.clienteId;

      if (clienteId) {
        logger.info(`Cliente ya existe (id: ${clienteId})`);
        return { clienteId, existente: true, data: errorData };
      }

      // Si la API no devuelve el id, buscar el cliente por teléfono en las citas
      logger.warn('Cliente duplicado pero sin id en respuesta. Buscando en citas...');
      try {
        const citasData = await apiCall('GET', '/obtener_citas');
        const citas = Array.isArray(citasData) ? citasData
          : citasData.payload || citasData.data || [];

        const telefono = clienteData.telefono;
        const citaCliente = citas.find(c => c.cliente?.telefono === telefono);

        if (citaCliente?.clienteId || citaCliente?.cliente?.id) {
          const idEncontrado = citaCliente.clienteId || citaCliente.cliente.id;
          logger.info(`Cliente encontrado por teléfono en citas (id: ${idEncontrado})`);
          return { clienteId: idEncontrado, existente: true, data: errorData };
        }
      } catch (buscarError) {
        logger.error('Error buscando cliente en citas:', buscarError.message);
      }

      // Último recurso: devolver error con el mensaje de la API
      logger.error('No se pudo obtener el id del cliente existente');
      return { clienteId: null, existente: true, data: errorData };
    }

    throw error;
  }
}

async function registrarCita(citaData) {
  return apiCall('POST', '/registrar_cita', citaData);
}

module.exports = {
  obtenerEmpresas, obtenerTerapias, obtenerCitas,
  obtenerDoctores, obtenerFuentes, obtenerHorariosDisponibles,
  registrarCliente, registrarCita
};
