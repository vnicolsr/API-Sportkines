/**
 * Controller: Obtener Días Disponibles
 *
 * Genera los próximos 10 días hábiles (L-S).
 * Los días no dependen de la sucursal; la disponibilidad real
 * se valida cuando se consultan horarios.
 *
 * POST /obtener-dias
 *   Body: { pagina: 1 }
 *
 *   Response:
 *   {
 *     dia1_fecha: "2026-04-24",
 *     dia1_label: "Jue 24 de Abr",
 *     dia2_fecha: "2026-04-25",
 *     dia2_label: "Vie 25 de Abr",
 *     hay_mas: true,
 *     pagina_siguiente: 2,
 *     total_dias: 10
 *   }
 */

const { logger } = require('../utils/logger');

const MAX_DAYS = 10;
const PAGE_SIZE = 2;

function getNextBusinessDays(count = MAX_DAYS) {
  const days = [];
  const current = new Date();
  current.setDate(current.getDate() + 1);

  while (days.length < count) {
    if (current.getDay() !== 0) {
      // Usar componentes locales para evitar desfase UTC
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;
      const label = formatDateLabel(current);
      days.push({ fecha: iso, label });
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function formatDateLabel(date) {
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${diasSemana[date.getDay()]} ${date.getDate()} de ${meses[date.getMonth()]}`;
}

async function obtenerDias(req, res) {
  try {
    const pagina = parseInt(req.body.pagina, 10) || 1;
    const allDays = getNextBusinessDays(MAX_DAYS);

    const startIndex = (pagina - 1) * PAGE_SIZE;
    const pageDays = allDays.slice(startIndex, startIndex + PAGE_SIZE);
    const hayMas = (startIndex + PAGE_SIZE) < allDays.length;

    const response = {
      dia1_fecha: pageDays[0]?.fecha || '',
      dia1_label: pageDays[0]?.label || '',
      dia2_fecha: pageDays[1]?.fecha || '',
      dia2_label: pageDays[1]?.label || '',
      hay_mas: hayMas,
      pagina_actual: pagina,
      pagina_siguiente: hayMas ? pagina + 1 : pagina,
      total_dias: allDays.length
    };

    logger.info('Días generados:', response);
    return res.json(response);
  } catch (error) {
    logger.error('Error en obtenerDias:', error.message);
    return res.status(500).json({ error: true, message: 'Error al obtener días' });
  }
}

module.exports = { obtenerDias };
