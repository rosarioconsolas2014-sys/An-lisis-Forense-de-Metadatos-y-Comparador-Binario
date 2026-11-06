/**
 * Utilidades criptográficas y de formato de bytes.
 * Utiliza Web Crypto API (SubtleCrypto) para cálculo local de SHA-256.
 */

/**
 * Calcula el hash SHA-256 de un ArrayBuffer o Blob usando Web Crypto API.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} hash en minúsculas de 64 caracteres hex
 */
export async function computeSHA256(buffer) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('La Web Crypto API no está disponible en este entorno.');
  }
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formatea un tamaño exacto en bytes a formato legible (B, KB, MB, GB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatReadableSize(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${num.toLocaleString('es-ES')} ${sizes[i]}`;
}

/**
 * Formatea una fecha numérica o Date a formato forense ISO legible en español
 * @param {Date|number|string} dateInput
 * @returns {string}
 */
export function formatForensicDate(dateInput) {
  if (!dateInput) return 'No disponible';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return 'No disponible';
  }
}

/**
 * Genera una estructura de volcado hexadecimal (Hex Dump) para un buffer.
 * Cada fila contiene: offset (0x00000000), 16 bytes en hex agrupados de a 8, y los 16 caracteres ASCII.
 * @param {Uint8Array} bytes
 * @param {number} maxBytes
 * @returns {Array<{offset: string, hex1: string, hex2: string, ascii: string}>}
 */
export function generateHexDump(bytes, maxBytes = 256) {
  const length = Math.min(bytes.length, maxBytes);
  const rows = [];

  for (let i = 0; i < length; i += 16) {
    const offset = '0x' + i.toString(16).padStart(8, '0').toUpperCase();
    const chunk = bytes.slice(i, Math.min(i + 16, length));

    const hexBytes = [];
    let ascii = '';

    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexBytes.push(b.toString(16).padStart(2, '0').toUpperCase());
        // Imprimibles ASCII estándar: 32 a 126
        if (b >= 32 && b <= 126) {
          ascii += String.fromCharCode(b);
        } else {
          ascii += '·';
        }
      } else {
        hexBytes.push('  ');
        ascii += ' ';
      }
    }

    rows.push({
      offset,
      hex1: hexBytes.slice(0, 8).join(' '),
      hex2: hexBytes.slice(8, 16).join(' '),
      ascii,
    });
  }

  return rows;
}
