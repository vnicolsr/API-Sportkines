/**
 * Datos de ubicación por empresa.
 *
 * Cuando el middleware recibe empresa_id, busca aquí
 * la ciudad y entidad correspondientes. Así no necesitas
 * pedirle esos datos al usuario en Manychat.
 */

const EMPRESA_UBICACION = {
  1:  { ciudad: 'Culiacán',        entidad: 'Sinaloa' },
  5:  { ciudad: 'Culiacán',        entidad: 'Sinaloa' },
  6:  { ciudad: 'Culiacán',        entidad: 'Sinaloa' },
  9:  { ciudad: 'Villahermosa',    entidad: 'Tabasco' },
  11: { ciudad: 'Mazatlán',        entidad: 'Sinaloa' },
  12: { ciudad: 'Tampico',         entidad: 'Tamaulipas' },
  13: { ciudad: 'Mexicali',        entidad: 'Baja California' },
  14: { ciudad: 'Ciudad Juárez',   entidad: 'Chihuahua' },
  15: { ciudad: 'Tijuana',         entidad: 'Baja California' },
  17: { ciudad: 'Guadalajara',     entidad: 'Jalisco' },
  18: { ciudad: 'Culiacán',        entidad: 'Sinaloa' },
};

/**
 * Obtiene ciudad y entidad por empresaId.
 *
 * @param {number} empresaId
 * @returns {{ ciudad: string, entidad: string }}
 */
function getUbicacion(empresaId) {
  return EMPRESA_UBICACION[empresaId] || { ciudad: '', entidad: '' };
}

module.exports = { getUbicacion, EMPRESA_UBICACION };
