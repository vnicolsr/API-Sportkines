const { registrarCliente, registrarCita } = require('../services/sportkinesService');
const { normalizePhone, normalizeDate, normalizeGender, parseName } = require('../utils/sanitize');
const { getUbicacion } = require('../config/ubicacionConfig');
const { logger } = require('../utils/logger');

async function confirmarCita(req, res) {
  try {
    const body = req.body;

    const { nombre, apellidoP, apellidoM } = parseName(body.nombre_completo || body.full_name || '');
    const telefono = normalizePhone(body.telefono || body.phone || '');
    const empresaId = parseInt(body.empresa_id, 10);
    const fecha = body.fecha_seleccionada || '';
    const horaRaw = body.hora_seleccionada || '';
    const hora = horaRaw.split(':').slice(0, 2).join(':');
    const genero = normalizeGender(body.genero || body.gender);
    const fechaNacimiento = normalizeDate(body.fecha_nacimiento || body.birth_date);
    const tipoLesion = body.tipo_lesion || body.injury_type || 'No especificado';

    const { ciudad, entidad } = getUbicacion(empresaId);

    if (!nombre) return res.json({ exito: false, mensaje: 'No se recibió el nombre del paciente' });
    if (!telefono) return res.json({ exito: false, mensaje: 'Teléfono inválido. Debe tener 10 dígitos' });
    if (!fecha || !hora) return res.json({ exito: false, mensaje: 'Faltan fecha u hora de la cita' });
    if (!empresaId) return res.json({ exito: false, mensaje: 'No se recibió la sucursal' });

    // Generar correo único por cliente usando su teléfono
    const correo = `PUBLYCOM_${telefono}@PUBLYCOM.COM`;

    logger.info('Registrando cliente...', { nombre, apellidoP, telefono, empresaId, ciudad, entidad, correo });

    const clienteResult = await registrarCliente({
      nombre, apellidoP, apellidoM, telefono,
      correo,
      ciudad, entidad, genero, fechaNacimiento, tipoLesion, empresaId,
      personaId: parseInt(process.env.FIXED_PERSONA_ID, 10) || 626,
      fuenteId: parseInt(process.env.FIXED_FUENTE_ID, 10) || 1
    });

    const clienteId = clienteResult.clienteId;
    const clienteExistente = clienteResult.existente;

    logger.info(clienteExistente
      ? `Cliente ya existía (id: ${clienteId}). Continuando...`
      : `Cliente nuevo registrado (id: ${clienteId})`);

    if (!clienteId) {
      logger.error('No se obtuvo clienteId:', clienteResult);
      return res.json({ exito: false, mensaje: 'Error al registrar datos del paciente' });
    }

    logger.info('Registrando cita...', { fecha, hora, clienteId, empresaId });
    const citaResult = await registrarCita({ fecha, hora, clienteId, empresaId });
    logger.info('Cita registrada:', citaResult);

    return res.json({
      exito: true,
      cliente_id: clienteId,
      cliente_existente: clienteExistente,
      nombre, apellido: apellidoP, fecha, hora,
      ciudad,
      mensaje: 'Cita confirmada exitosamente'
    });
  } catch (error) {
    logger.error('Error en confirmarCita:', error.message);
    const msg = error.response?.data?.msg || error.response?.data?.message || 'Error al confirmar la cita';
    return res.json({ exito: false, mensaje: msg });
  }
}

module.exports = { confirmarCita };
