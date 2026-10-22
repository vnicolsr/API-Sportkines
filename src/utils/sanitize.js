/**
 * Utilidades de sanitización y normalización de datos
 * provenientes de Manychat.
 */

/**
 * Normaliza un número de teléfono a exactamente 10 dígitos.
 * Elimina prefijo de país (+52, 52), espacios, guiones y paréntesis.
 *
 * @param {string} phone - Teléfono crudo desde Manychat
 * @returns {string} Teléfono de 10 dígitos o cadena vacía si inválido
 */
function normalizePhone(phone) {
  if (!phone) return '';

  // Eliminar todo lo que no sea dígito
  let digits = String(phone).replace(/\D/g, '');

  // Si tiene 13 dígitos y empieza con 521 (código país + 1 móvil), quitar prefijo
  if (digits.length === 13 && digits.startsWith('521')) {
    digits = digits.slice(3);
  }
  // Si tiene 12 dígitos y empieza con 52 (código país), quitar prefijo
  else if (digits.length === 12 && digits.startsWith('52')) {
    digits = digits.slice(2);
  }
  // Si tiene 11 dígitos y empieza con 1 (lada móvil legacy), quitar prefijo
  else if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  // Validar que sean exactamente 10 dígitos
  if (/^\d{10}$/.test(digits)) {
    return digits;
  }

  return '';
}

/**
 * Valida y normaliza una fecha a formato ISO 8601 (YYYY-MM-DD).
 * Soporta formatos comunes: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
 *
 * @param {string} dateStr - Fecha cruda
 * @param {string} fallback - Fecha fallback (default: '2000-01-01')
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function normalizeDate(dateStr, fallback = '2000-01-01') {
  if (!dateStr) return fallback;

  const raw = String(dateStr).trim();

  // Ya viene en ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return isValidDate(raw) ? raw : fallback;
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return isValidDate(iso) ? iso : fallback;
  }

  return fallback;
}

/**
 * Verifica que una fecha ISO sea válida.
 */
function isValidDate(isoStr) {
  const date = new Date(isoStr + 'T00:00:00Z');
  return !isNaN(date.getTime()) && isoStr === date.toISOString().split('T')[0];
}

/**
 * Normaliza el género. Si no se recibe, genera uno aleatorio.
 *
 * @param {string} gender - Valor crudo del género
 * @returns {string} 'M' o 'F'
 */
function normalizeGender(gender) {
  if (!gender) {
    return Math.random() > 0.5 ? 'M' : 'F';
  }

  const normalized = String(gender).trim().toUpperCase();

  if (['M', 'MASCULINO', 'MALE', 'HOMBRE', 'H'].includes(normalized)) return 'M';
  if (['F', 'FEMENINO', 'FEMALE', 'MUJER'].includes(normalized)) return 'F';

  return Math.random() > 0.5 ? 'M' : 'F';
}

/**
 * Separa un nombre completo en nombre, apellido paterno y materno.
 * Maneja apellidos compuestos: de la, del, de los, de las, van, von, etc.
 *
 * Ejemplos:
 *   "Juan Pérez López"              → { nombre: "Juan", apellidoP: "Pérez", apellidoM: "López" }
 *   "María de la Torre García"      → { nombre: "María", apellidoP: "de la Torre", apellidoM: "García" }
 *   "Carlos del Valle de los Ríos"  → { nombre: "Carlos", apellidoP: "del Valle", apellidoM: "de los Ríos" }
 *   "Ana García de la Cruz"         → { nombre: "Ana", apellidoP: "García", apellidoM: "de la Cruz" }
 *   "Luis Eduardo San Martín Vega"  → { nombre: "Luis Eduardo", apellidoP: "San Martín", apellidoM: "Vega" }
 *   "Pedro"                         → { nombre: "Pedro", apellidoP: "", apellidoM: "" }
 *   "Pedro García"                  → { nombre: "Pedro", apellidoP: "García", apellidoM: "" }
 *
 * @param {string} fullName - Nombre completo
 * @returns {{ nombre: string, apellidoP: string, apellidoM: string }}
 */
function parseName(fullName) {
  if (!fullName) return { nombre: '', apellidoP: '', apellidoM: '' };

  const raw = String(fullName).trim();
  if (!raw) return { nombre: '', apellidoP: '', apellidoM: '' };

  // Partículas que forman parte de un apellido compuesto
  const particulas = new Set([
    'de', 'del', 'la', 'las', 'los', 'el',
    'san', 'santa', 'saint',
    'van', 'von', 'di', 'da', 'dos', 'das', 'le', 'mac', 'mc'
  ]);

  const words = raw.split(/\s+/);

  if (words.length === 1) {
    return { nombre: words[0], apellidoP: '', apellidoM: '' };
  }
  if (words.length === 2) {
    return { nombre: words[0], apellidoP: words[1], apellidoM: '' };
  }

  // Agrupar palabras en tokens, fusionando partículas con la palabra siguiente
  // "de" + "la" + "Torre" → "de la Torre"
  // "García" → "García"
  const tokens = [];
  let i = 0;

  while (i < words.length) {
    if (particulas.has(words[i].toLowerCase()) && i + 1 < words.length) {
      // Acumular partículas consecutivas + palabra final
      let compound = words[i];
      i++;
      while (i < words.length && particulas.has(words[i].toLowerCase())) {
        compound += ' ' + words[i];
        i++;
      }
      // Agregar la palabra que sigue a las partículas
      if (i < words.length) {
        compound += ' ' + words[i];
        i++;
      }
      tokens.push(compound);
    } else {
      tokens.push(words[i]);
      i++;
    }
  }

  // Ahora tokens tiene grupos limpios:
  // "María de la Torre García" → ["María", "de la Torre", "García"]
  // "Luis Eduardo San Martín Vega" → ["Luis", "Eduardo", "San Martín", "Vega"]

  if (tokens.length === 1) {
    return { nombre: tokens[0], apellidoP: '', apellidoM: '' };
  }
  if (tokens.length === 2) {
    return { nombre: tokens[0], apellidoP: tokens[1], apellidoM: '' };
  }

  // 3+ tokens: últimos 2 son apellidos, el resto es nombre
  return {
    nombre: tokens.slice(0, tokens.length - 2).join(' '),
    apellidoP: tokens[tokens.length - 2],
    apellidoM: tokens[tokens.length - 1]
  };
}

module.exports = {
  normalizePhone,
  normalizeDate,
  normalizeGender,
  parseName,
  isValidDate
};
