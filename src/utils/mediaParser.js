/**
 * Analizador forense de contenedores multimedia de Audio y Video.
 * Extrae etiquetas ID3v1/ID3v2, metadatos atómicos MP4/MOV y propiedades técnicas HTML5.
 */
import { formatForensicDate } from './crypto.js';

/**
 * Extrae etiquetas ID3 (v1 y v2) de un archivo de audio MP3
 * @param {ArrayBuffer} buffer
 * @returns {object}
 */
export function parseID3Tags(buffer) {
  const bytes = new Uint8Array(buffer);
  const result = {
    hasID3: false,
    version: null,
    title: null,
    artist: null,
    album: null,
    year: null,
    genre: null,
    track: null,
    comment: null,
    encoder: null,
  };

  // 1. Probar ID3v2 en el inicio del archivo
  if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    result.hasID3 = true;
    const majorVer = bytes[3];
    const revision = bytes[4];
    result.version = `ID3v2.${majorVer}.${revision}`;

    // Tamaño de cabecera ID3v2 (synchsafe integer: 4 bytes de 7 bits)
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    const maxScan = Math.min(bytes.length, 10 + tagSize);
    let offset = 10;

    // Parser simplificado de frames ID3v2.3 y ID3v2.4 (ID de 4 caracteres)
    while (offset + 10 < maxScan) {
      const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
      // Si encontramos padding con ceros, terminamos
      if (bytes[offset] === 0) break;

      let frameSize = 0;
      if (majorVer === 4) {
        // synchsafe int
        frameSize =
          ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f);
      } else {
        // 32-bit big endian standard
        frameSize =
          (bytes[offset + 4] << 24) |
          (bytes[offset + 5] << 16) |
          (bytes[offset + 6] << 8) |
          bytes[offset + 7];
      }

      if (frameSize <= 0 || offset + 10 + frameSize > maxScan) break;

      const frameDataOffset = offset + 10;
      const encoding = bytes[frameDataOffset]; // 0: ISO-8859-1, 1: UTF-16 con BOM, 3: UTF-8

      let textContent = '';
      try {
        const payload = bytes.slice(frameDataOffset + 1, frameDataOffset + frameSize);
        if (encoding === 3) {
          textContent = new TextDecoder('utf-8').decode(payload);
        } else if (encoding === 1) {
          textContent = new TextDecoder('utf-16').decode(payload);
        } else {
          textContent = new TextDecoder('iso-8859-1').decode(payload);
        }
        textContent = textContent.replace(/\0/g, '').trim();
      } catch {
        textContent = '';
      }

      if (textContent) {
        if (frameId === 'TIT2') result.title = textContent;
        else if (frameId === 'TPE1') result.artist = textContent;
        else if (frameId === 'TALB') result.album = textContent;
        else if (frameId === 'TYER' || frameId === 'TDRC') result.year = textContent;
        else if (frameId === 'TRCK') result.track = textContent;
        else if (frameId === 'TCON') result.genre = textContent;
        else if (frameId === 'COMM') result.comment = textContent;
        else if (frameId === 'TSSE' || frameId === 'TENC') result.encoder = textContent;
      }

      offset += 10 + frameSize;
    }
  }

  // 2. Si no se obtuvo información o para complementar, probar ID3v1 (últimos 128 bytes)
  if (bytes.length >= 128) {
    const v1Offset = bytes.length - 128;
    const tag = String.fromCharCode(bytes[v1Offset], bytes[v1Offset + 1], bytes[v1Offset + 2]);
    if (tag === 'TAG') {
      result.hasID3 = true;
      if (!result.version) result.version = 'ID3v1';

      const readString = (start, len) => {
        const slice = bytes.slice(start, start + len);
        return new TextDecoder('iso-8859-1').decode(slice).replace(/\0/g, '').trim();
      };

      if (!result.title) result.title = readString(v1Offset + 3, 30);
      if (!result.artist) result.artist = readString(v1Offset + 33, 30);
      if (!result.album) result.album = readString(v1Offset + 63, 30);
      if (!result.year) result.year = readString(v1Offset + 93, 4);
      if (!result.comment) result.comment = readString(v1Offset + 97, 28);
    }
  }

  return result;
}

/**
 * Escanea átomos de MP4 / QuickTime (ftyp, mvhd) para extraer fecha de creación interna y codecs
 * @param {ArrayBuffer} buffer
 * @returns {object}
 */
export function parseMp4Atoms(buffer) {
  const bytes = new Uint8Array(buffer);
  const result = {
    isMp4: false,
    majorBrand: null,
    creationDate: null,
    modificationDate: null,
    durationSeconds: null,
    timeScale: null,
    codecs: [],
  };

  if (bytes.length < 16) return result;

  const readUint32 = (offset) => {
    return (
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]
    ) >>> 0;
  };

  const readFourCC = (offset) => {
    return String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
  };

  // Buscar marca ftyp en los primeros bytes
  let offset = 0;
  const maxScan = Math.min(bytes.length, 1024 * 1024); // escanear hasta 1 MB

  while (offset + 8 <= maxScan) {
    const size = readUint32(offset);
    if (size < 8) break;
    const type = readFourCC(offset + 4);

    if (type === 'ftyp') {
      result.isMp4 = true;
      if (offset + 12 <= bytes.length) {
        result.majorBrand = readFourCC(offset + 8).trim();
      }
    } else if (type === 'moov') {
      result.isMp4 = true;
      // Explorar adentro de moov
      let moovOffset = offset + 8;
      const moovEnd = offset + size;

      while (moovOffset + 8 <= moovEnd && moovOffset < maxScan) {
        const subSize = readUint32(moovOffset);
        if (subSize < 8) break;
        const subType = readFourCC(moovOffset + 4);

        if (subType === 'mvhd') {
          // mvhd header: version en moovOffset + 8
          const version = bytes[moovOffset + 8];
          let creationTimeRaw = 0;
          let modTimeRaw = 0;
          let timeScale = 0;
          let durationUnits = 0;

          if (version === 1) {
            // 64-bit timestamps
            // Usamos los 32 bits menos significativos para compatibilidad
            creationTimeRaw = readUint32(moovOffset + 16);
            modTimeRaw = readUint32(moovOffset + 24);
            timeScale = readUint32(moovOffset + 28);
            durationUnits = readUint32(moovOffset + 36);
          } else {
            // 32-bit timestamps
            creationTimeRaw = readUint32(moovOffset + 12);
            modTimeRaw = readUint32(moovOffset + 16);
            timeScale = readUint32(moovOffset + 20);
            durationUnits = readUint32(moovOffset + 24);
          }

          // La época de MP4 comienza el 1 de enero de 1904 UTC
          // Diferencia en segundos entre 1904 y 1970 = 2082844800 segundos
          const mp4EpochOffset = 2082844800;
          if (creationTimeRaw > mp4EpochOffset) {
            const unixTimeMs = (creationTimeRaw - mp4EpochOffset) * 1000;
            result.creationDate = formatForensicDate(new Date(unixTimeMs));
          }
          if (modTimeRaw > mp4EpochOffset) {
            const unixTimeMs = (modTimeRaw - mp4EpochOffset) * 1000;
            result.modificationDate = formatForensicDate(new Date(unixTimeMs));
          }

          if (timeScale > 0 && durationUnits > 0) {
            result.timeScale = timeScale;
            result.durationSeconds = parseFloat((durationUnits / timeScale).toFixed(2));
          }
        }

        moovOffset += subSize;
      }
    }

    // Detectar codecs comunes en la firma inicial
    const subSlice = bytes.slice(offset, Math.min(offset + size, bytes.length));
    const subStr = new TextDecoder('ascii', { fatal: false }).decode(subSlice);
    if (subStr.includes('avc1') && !result.codecs.includes('H.264 / AVC (avc1)')) {
      result.codecs.push('H.264 / AVC (avc1)');
    }
    if ((subStr.includes('hvc1') || subStr.includes('hev1')) && !result.codecs.includes('H.265 / HEVC')) {
      result.codecs.push('H.265 / HEVC');
    }
    if (subStr.includes('mp4a') && !result.codecs.includes('AAC Audio (mp4a)')) {
      result.codecs.push('AAC Audio (mp4a)');
    }
    if (subStr.includes('vp09') && !result.codecs.includes('VP9 Video')) {
      result.codecs.push('VP9 Video');
    }
    if (subStr.includes('av01') && !result.codecs.includes('AV1 Video')) {
      result.codecs.push('AV1 Video');
    }

    offset += size;
  }

  return result;
}

/**
 * Obtiene duración y dimensiones para audio y video mediante elemento HTML5 en el navegador
 * @param {File} file
 * @param {string} type 'audio' | 'video'
 * @returns {Promise<object>}
 */
export function probeHtml5Media(file, type = 'video') {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const mediaEl = document.createElement(type);

    mediaEl.preload = 'metadata';
    mediaEl.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      mediaEl.src = '';
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        duration: null,
        durationFormatted: 'No disponible',
        width: null,
        height: null,
      });
    }, 4000);

    mediaEl.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = mediaEl.duration && !isNaN(mediaEl.duration) ? mediaEl.duration : null;
      let durationFormatted = 'No disponible';
      if (duration !== null) {
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        const ms = Math.floor((duration % 1) * 100);
        durationFormatted = `${mins}m ${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}s`;
      }

      const info = {
        duration,
        durationFormatted,
        width: type === 'video' ? mediaEl.videoWidth || null : null,
        height: type === 'video' ? mediaEl.videoHeight || null : null,
      };

      cleanup();
      resolve(info);
    };

    mediaEl.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve({
        duration: null,
        durationFormatted: 'No disponible',
        width: null,
        height: null,
      });
    };

    mediaEl.src = url;
  });
}
