/**
 * Controller: Obtener Horarios Disponibles
 *
 * Cruza los slots de horario con las citas existentes.
 * Un slot se considera ocupado cuando el número de citas
 * en esa hora alcanza el aforo de la empresa.
 *
 * Flujo:
 * 1. Obtener todos los slots → POST /obtener_horarios_disponibles
 * 2. Obtener citas existentes → GET /obtener_citas
 * 3. Obtener datos de empresa (aforo) → GET /obtener_empresas_usuario
 * 4. Filtrar: quitar slots donde citas_en_slot >= aforo
 * 5. Devolver solo los horarios realmente disponibles
 *
 * POST /obtener-horarios
 *   Body: {
 *     empresa_id: "1",
 *     fecha_seleccionada: "2026-04-28",
 *     pagina: "1"
 *   }
 */

const {
  obtenerHorariosDisponibles,
  obtenerCitas,
  obtenerEmpresas
} = require('../services/sportkinesService');
const { getAforo } = require('../config/aforoConfig');
const { logger } = require('../utils/logger');

const PAGE_SIZE = 2;

async function obtenerHorarios(req, res) {
  try {
    const empresaId = parseInt(req.body.empresa_id, 10);
    const fecha = req.body.fecha_seleccionada;
    const pagina = parseInt(req.body.pagina, 10) || 1;

    if (!empresaId) {
      return res.json({ error: true, sin_horarios: true, message: 'No se recibió empresa_id' });
    }
    if (!fecha) {
      return res.json({ error: true, sin_horarios: true, message: 'No se recibió la fecha' });
    }

    // ── 1. Obtener todos los slots del día ──
    const slotsData = await obtenerHorariosDisponibles(empresaId, fecha);
    const allSlots = Array.isArray(slotsData) ? slotsData
      : slotsData.payload || slotsData.horarios || slotsData.data || [];

    if (allSlots.length === 0) {
      return res.json({
        hora1: '', hora2: '',
        hay_mas_horarios: false,
        horarios_restantes: 0,
        total_horarios: 0,
        sin_horarios: true
      });
    }

    // ── 2. Obtener citas existentes para esa empresa y fecha ──
    const citasData = await obtenerCitas();
    const allCitas = Array.isArray(citasData) ? citasData
      : citasData.payload || citasData.data || [];

    // Filtrar citas de esta empresa y fecha
    const citasDelDia = allCitas.filter(c =>
      c.empresaId === empresaId && c.fecha === fecha
    );

    // Contar cuántas citas hay por cada hora
    const citasPorHora = {};
    citasDelDia.forEach(c => {
      const hora = c.hora || '';
      citasPorHora[hora] = (citasPorHora[hora] || 0) + 1;
    });

    // ── 3. Obtener aforo de la empresa ──
    const empresasData = await obtenerEmpresas();
    const empresas = Array.isArray(empresasData) ? empresasData
      : empresasData.payload || empresasData.data || [];

    const empresa = empresas.find(e => e.id === empresaId);
    const aforoApi = empresa?.aforo || null;
    const aforo = getAforo(empresaId, aforoApi);

    logger.info(`Empresa ${empresaId}: aforo_api=${aforoApi}, aforo_usado=${aforo}, citas del día=${citasDelDia.length}`);

    // ── 4. Filtrar: quitar slots donde citas >= aforo ──
    const horasDisponibles = allSlots.filter(slot => {
      const hora = String(slot);
      const citasEnSlot = citasPorHora[hora] || 0;
      return citasEnSlot < aforo;
    });

    logger.info(`Slots totales: ${allSlots.length}, disponibles: ${horasDisponibles.length}`);

    if (horasDisponibles.length === 0) {
      return res.json({
        hora1: '', hora2: '',
        hay_mas_horarios: false,
        horarios_restantes: 0,
        total_horarios: 0,
        sin_horarios: true
      });
    }

    // ── 5. Paginar ──
    const startIndex = (pagina - 1) * PAGE_SIZE;
    const pageHoras = horasDisponibles.slice(startIndex, startIndex + PAGE_SIZE);
    const hayMas = (startIndex + PAGE_SIZE) < horasDisponibles.length;

    const response = {
      hora1: pageHoras[0] ? String(pageHoras[0]) : '',
      hora2: pageHoras[1] ? String(pageHoras[1]) : '',
      hay_mas_horarios: hayMas,
      horarios_restantes: hayMas ? horasDisponibles.length - (startIndex + PAGE_SIZE) : 0,
      pagina_siguiente: hayMas ? pagina + 1 : pagina,
      total_horarios: horasDisponibles.length,
      sin_horarios: false
    };

    logger.info('Horarios disponibles:', response);
    return res.json(response);
  } catch (error) {
    logger.error('Error en obtenerHorarios:', error.message);
    return res.status(500).json({ error: true, sin_horarios: true, message: 'Error al obtener horarios' });
  }
}

module.exports = { obtenerHorarios };
