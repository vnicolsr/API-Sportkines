/**
 * Aforo manual por empresa.
 *
 * Si una empresa tiene un valor aquí, se usa este en lugar
 * del que devuelve la API. Útil para:
 *   - Ambiente de pruebas donde el aforo no es real
 *   - Sobreescribir temporalmente el aforo de una sucursal
 *
 * La clave es el empresaId (número).
 * El valor es el aforo máximo (citas simultáneas por horario).
 *
 * Si la empresa NO está aquí → se usa el aforo de la API.
 *
 * Ejemplo:
 *   1:  3,   → Sportkines Angeles: máx 3 citas por horario
 *   13: 2,   → Sportkines Mexicali: máx 2 citas por horario
 */

const AFORO_OVERRIDES = {
  1: 4,    // CLN Angeles
  5: 5,    // CLN Primavera
  6: 4,    // CLN Tres Rios
  9: 3,    // Villahermosa
  11: 2,   // Mazatlán
  12: 6,   // Tampico
  13: 4,   // Mexicali
  14: 5,   // Cd. Juárez
  15: 5,   // Tijuana
  17: 3,   // GDL Guevara
  18: 1,   // CLN Piedica
};

/**
 * Obtiene el aforo para una empresa.
 * Prioridad: override manual > API > default (1)
 *
 * @param {number} empresaId
 * @param {number|null} aforoApi - Aforo que devolvió la API
 * @returns {number}
 */
function getAforo(empresaId, aforoApi) {
  // 1. Si hay override manual, usarlo
  if (AFORO_OVERRIDES[empresaId] !== undefined) {
    return AFORO_OVERRIDES[empresaId];
  }

  // 2. Si la API devolvió un valor razonable, usarlo
  if (aforoApi && aforoApi > 0) {
    return aforoApi;
  }

  // 3. Default: 1 cita por horario
  return 1;
}

module.exports = { getAforo, AFORO_OVERRIDES };
