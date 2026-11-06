/**
 * Motor de comparación forense múltiple (Binaria, Metadatos y Visual Perceptual).
 */
import { comparePerceptualHashes } from './imageHash.js';

/**
 * Encuentra el primer byte diferente entre dos ArrayBuffers y calcula estadísticas de diferencia
 * @param {ArrayBuffer} bufferA
 * @param {ArrayBuffer} bufferB
 * @returns {object}
 */
export function computeBinaryByteDiff(bufferA, bufferB) {
  const bytesA = new Uint8Array(bufferA);
  const bytesB = new Uint8Array(bufferB);

  const lengthA = bytesA.length;
  const lengthB = bytesB.length;
  const minLength = Math.min(lengthA, lengthB);

  let firstDiffOffset = null;
  let byteAVal = null;
  let byteBVal = null;
  let differingBytesCount = 0;

  // Buscar primer byte diferente
  for (let i = 0; i < minLength; i++) {
    if (bytesA[i] !== bytesB[i]) {
      if (firstDiffOffset === null) {
        firstDiffOffset = i;
        byteAVal = bytesA[i];
        byteBVal = bytesB[i];
      }
      differingBytesCount++;
    }
  }

  // Si uno es más largo que el otro, los bytes restantes son diferencias
  const sizeDiff = Math.abs(lengthA - lengthB);
  if (lengthA !== lengthB && firstDiffOffset === null) {
    firstDiffOffset = minLength; // La diferencia arranca donde termina el más corto
    byteAVal = lengthA > minLength ? bytesA[minLength] : null;
    byteBVal = lengthB > minLength ? bytesB[minLength] : null;
  }

  const totalDifferingBytes = differingBytesCount + sizeDiff;
  const maxLength = Math.max(lengthA, lengthB);
  const matchPercentage = maxLength > 0 ? (((maxLength - totalDifferingBytes) / maxLength) * 100).toFixed(2) : '100.00';

  // Generar muestra de ventana de contexto alrededor del primer byte diferente (16 bytes antes y 16 después)
  let diffWindowA = [];
  let diffWindowB = [];
  let windowStart = 0;

  if (firstDiffOffset !== null) {
    windowStart = Math.max(0, firstDiffOffset - 8);
    const windowEnd = Math.min(maxLength, firstDiffOffset + 24);

    for (let pos = windowStart; pos < windowEnd; pos++) {
      const bA = pos < lengthA ? bytesA[pos] : null;
      const bB = pos < lengthB ? bytesB[pos] : null;
      diffWindowA.push({
        pos,
        hex: bA !== null ? bA.toString(16).padStart(2, '0').toUpperCase() : '--',
        ascii: bA !== null && bA >= 32 && bA <= 126 ? String.fromCharCode(bA) : '·',
        isDiff: bA !== bB,
        isFirstDiff: pos === firstDiffOffset,
      });
      diffWindowB.push({
        pos,
        hex: bB !== null ? bB.toString(16).padStart(2, '0').toUpperCase() : '--',
        ascii: bB !== null && bB >= 32 && bB <= 126 ? String.fromCharCode(bB) : '·',
        isDiff: bA !== bB,
        isFirstDiff: pos === firstDiffOffset,
      });
    }
  }

  return {
    identical: lengthA === lengthB && totalDifferingBytes === 0,
    sameSize: lengthA === lengthB,
    sizeDiffBytes: sizeDiff,
    firstDiffOffset,
    firstDiffOffsetHex: firstDiffOffset !== null ? '0x' + firstDiffOffset.toString(16).padStart(8, '0').toUpperCase() : null,
    byteA: byteAVal !== null ? { hex: byteAVal.toString(16).padStart(2, '0').toUpperCase(), char: byteAVal >= 32 && byteAVal <= 126 ? String.fromCharCode(byteAVal) : '·' } : null,
    byteB: byteBVal !== null ? { hex: byteBVal.toString(16).padStart(2, '0').toUpperCase(), char: byteBVal >= 32 && byteBVal <= 126 ? String.fromCharCode(byteBVal) : '·' } : null,
    totalDifferingBytes,
    matchPercentage,
    diffWindowA,
    diffWindowB,
    windowStart,
  };
}

/**
 * Agrupa una lista de archivos analizados en grupos de duplicados (mismo SHA-256)
 * @param {Array<object>} files
 * @returns {object} { duplicateGroups: Array<Array<object>>, uniqueFiles: Array<object> }
 */
export function findDuplicateClusters(files) {
  const hashGroups = {};
  for (const f of files) {
    if (!hashGroups[f.sha256]) {
      hashGroups[f.sha256] = [];
    }
    hashGroups[f.sha256].push(f);
  }

  const duplicateGroups = [];
  const uniqueFiles = [];

  for (const group of Object.values(hashGroups)) {
    if (group.length > 1) {
      duplicateGroups.push(group);
    } else {
      uniqueFiles.push(group[0]);
    }
  }

  return { duplicateGroups, uniqueFiles };
}

/**
 * Compara metadatos extraídos entre dos archivos y produce una matriz de diferencias
 * @param {object} fileA
 * @param {object} fileB
 * @returns {Array<{field: string, valA: string, valB: string, matches: boolean}>}
 */
export function compareFileMetadata(fileA, fileB) {
  const matrix = [];

  const addRow = (field, valA, valB) => {
    const sA = (valA !== undefined && valA !== null && String(valA).trim() !== '') ? String(valA) : 'No disponible';
    const sB = (valB !== undefined && valB !== null && String(valB).trim() !== '') ? String(valB) : 'No disponible';
    const bothAvail = sA !== 'No disponible' && sB !== 'No disponible';
    const matches = bothAvail ? sA === sB : (sA === sB); // Si ambos son 'No disponible' cuentan como iguales
    matrix.push({
      field,
      valA: sA,
      valB: sB,
      matches,
      bothAvailable: bothAvail,
    });
  };

  // Metadatos Generales
  addRow('Nombre de archivo', fileA.name, fileB.name);
  addRow('Extensión declarada', fileA.extension, fileB.extension);
  addRow('Tamaño exacto (bytes)', `${fileA.sizeBytes} B`, `${fileB.sizeBytes} B`);
  addRow('Tamaño legible', fileA.readableSize, fileB.readableSize);
  addRow('Tipo MIME reportado', fileA.mimeType, fileB.mimeType);
  addRow('Fecha de modificación externa', fileA.lastModified, fileB.lastModified);
  addRow('Firma binaria detectada', fileA.signature?.name, fileB.signature?.name);
  addRow('Encabezado mágico (Hex)', fileA.signature?.signatureHex, fileB.signature?.signatureHex);
  addRow('Hash SHA-256', fileA.sha256, fileB.sha256);

  // Metadatos EXIF si alguno los tiene
  const exifA = fileA.metadata?.exif;
  const exifB = fileB.metadata?.exif;
  if (exifA?.available || exifB?.available) {
    addRow('Cámara - Fabricante (Make)', exifA?.camera?.make, exifB?.camera?.make);
    addRow('Cámara - Modelo (Model)', exifA?.camera?.model, exifB?.camera?.model);
    addRow('Software de captura/edición', exifA?.camera?.software, exifB?.camera?.software);
    addRow('Lente / Óptica', exifA?.camera?.lens, exifB?.camera?.lens);
    addRow('Fecha de captura original', exifA?.capture?.dateTimeOriginal, exifB?.capture?.dateTimeOriginal);
    addRow('Tiempo de exposición', exifA?.camera?.exposureTime, exifB?.camera?.exposureTime);
    addRow('Apertura (F-Number)', exifA?.camera?.fNumber, exifB?.camera?.fNumber);
    addRow('Sensibilidad ISO', exifA?.camera?.iso, exifB?.camera?.iso);
    addRow('Espacio de color / Perfil ICC', exifA?.colorProfile || exifA?.capture?.colorSpace, exifB?.colorProfile || exifB?.capture?.colorSpace);

    // Coordenadas GPS
    const gpsA = exifA?.gps ? `${exifA.gps.latitude.toFixed(6)}, ${exifA.gps.longitude.toFixed(6)}` : 'No disponible';
    const gpsB = exifB?.gps ? `${exifB.gps.latitude.toFixed(6)}, ${exifB.gps.longitude.toFixed(6)}` : 'No disponible';
    addRow('Coordenadas GPS (Lat, Lon)', gpsA, gpsB);
  }

  // Metadatos PDF si alguno los tiene
  const pdfA = fileA.metadata?.pdf;
  const pdfB = fileB.metadata?.pdf;
  if (pdfA?.available || pdfB?.available) {
    addRow('PDF - Título', pdfA?.title, pdfB?.title);
    addRow('PDF - Autor', pdfA?.author, pdfB?.author);
    addRow('PDF - Asunto', pdfA?.subject, pdfB?.subject);
    addRow('PDF - Creador / Aplicación', pdfA?.creator, pdfB?.creator);
    addRow('PDF - Productor / Biblioteca', pdfA?.producer, pdfB?.producer);
    addRow('PDF - Fecha de creación interna', pdfA?.creationDate, pdfB?.creationDate);
    addRow('PDF - Fecha de modificación interna', pdfA?.modificationDate, pdfB?.modificationDate);
    addRow('PDF - Número de páginas', pdfA?.pageCount, pdfB?.pageCount);
  }

  // Metadatos Office si alguno los tiene
  const offA = fileA.metadata?.office;
  const offB = fileB.metadata?.office;
  if (offA?.available || offB?.available) {
    addRow('Office - Autor (Creator)', offA?.core?.creator, offB?.core?.creator);
    addRow('Office - Último modificador', offA?.core?.lastModifiedBy, offB?.core?.lastModifiedBy);
    addRow('Office - Aplicación', offA?.app?.application, offB?.app?.application);
    addRow('Office - Fecha de creación interna', offA?.core?.created, offB?.core?.created);
    addRow('Office - Fecha de modificación interna', offA?.core?.modified, offB?.core?.modified);
    addRow('Office - Revisión', offA?.core?.revision, offB?.core?.revision);
    addRow('Office - Conteo de páginas/hojas', offA?.app?.pages || offA?.sheets?.length, offB?.app?.pages || offB?.sheets?.length);
  }

  // Metadatos Multimedia
  const audA = fileA.metadata?.audio;
  const audB = fileB.metadata?.audio;
  if (audA || audB) {
    addRow('Audio - Título ID3', audA?.title, audB?.title);
    addRow('Audio - Artista ID3', audA?.artist, audB?.artist);
    addRow('Audio - Álbum ID3', audA?.album, audB?.album);
    addRow('Audio - Año ID3', audA?.year, audB?.year);
    addRow('Audio - Duración', audA?.durationFormatted, audB?.durationFormatted);
  }

  const vidA = fileA.metadata?.video;
  const vidB = fileB.metadata?.video;
  if (vidA || vidB) {
    addRow('Video - Resolución', vidA?.resolution, vidB?.resolution);
    addRow('Video - Duración', vidA?.durationFormatted, vidB?.durationFormatted);
    addRow('Video - Fecha interna de creación', vidA?.creationDate, vidB?.creationDate);
    addRow('Video - Códecs detectados', vidA?.codecs?.join(', '), vidB?.codecs?.join(', '));
  }

  return matrix;
}

/**
 * Compara visualmente dos imágenes utilizando sus hashes perceptuales (dHash)
 * @param {object} fileA
 * @param {object} fileB
 * @returns {object|null}
 */
export function compareVisualImages(fileA, fileB) {
  const hashA = fileA.metadata?.perceptualHash;
  const hashB = fileB.metadata?.perceptualHash;

  if (!hashA || !hashB) {
    return null;
  }

  const result = comparePerceptualHashes(hashA, hashB);
  return {
    hashA,
    hashB,
    ...result,
    disclaimer:
      'La similitud visual se calcula mediante hash perceptual de luminancia (dHash de 64 bits). Un alto porcentaje indica que las imágenes se ven iguales al ojo humano (ej. distinta resolución o compresión), pero NO representa identidad binaria ni integridad de datos forense.',
  };
}
