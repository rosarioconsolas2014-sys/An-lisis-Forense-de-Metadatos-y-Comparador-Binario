/**
 * Motor central de análisis forense digital.
 * Orquesta la extracción de propiedades, SHA-256, firmas binarias y metadatos especializados.
 */
import { computeSHA256, formatReadableSize, formatForensicDate, generateHexDump } from './crypto.js';
import { identifyBinarySignature, analyzeForensicDiscrepancies } from './signatures.js';
import { extractExifMetadata } from './exifParser.js';
import { extractPdfMetadata } from './pdfParser.js';
import { extractOfficeMetadata } from './officeParser.js';
import { extractArchiveMetadata } from './archiveParser.js';
import { parseID3Tags, parseMp4Atoms, probeHtml5Media } from './mediaParser.js';
import { computeImagePerceptualHash } from './imageHash.js';

/**
 * Realiza un análisis forense exhaustivo de un archivo local.
 * @param {File} file
 * @param {function} [onProgress]
 * @returns {Promise<object>}
 */
export async function analyzeFile(file, onProgress) {
  const startTime = performance.now();

  if (!file) {
    throw new Error('Archivo no especificado');
  }

  if (onProgress) onProgress('Leyendo contenido binario...');

  // Leer ArrayBuffer completo
  // Para archivos gigantes (> 250 MB), informamos límite de seguridad para evitar cuelgues del navegador
  const isVeryLarge = file.size > 250 * 1024 * 1024;
  if (isVeryLarge) {
    throw new Error(`El archivo supera el límite de seguridad de procesamiento en memoria del navegador (${formatReadableSize(file.size)}). El límite recomendado es 250 MB.`);
  }

  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) onProgress('Calculando hash criptográfico SHA-256...');
  const sha256 = await computeSHA256(arrayBuffer);

  if (onProgress) onProgress('Analizando firmas binarias y encabezado...');
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 512)));
  const hexDump = generateHexDump(headerBytes, 128);

  const signature = identifyBinarySignature(headerBytes, file.name);
  const discrepancy = analyzeForensicDiscrepancies(file.name, file.type, signature);

  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';

  // Base forensic record
  const forensicData = {
    id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`,
    fileRef: file,
    name: file.name,
    originalName: file.name,
    extension: ext ? `.${ext}` : 'Sin extensión',
    sizeBytes: file.size,
    readableSize: formatReadableSize(file.size),
    mimeType: file.type || 'No especificado por el navegador',
    lastModified: formatForensicDate(file.lastModified),
    lastModifiedTimestamp: file.lastModified,
    sha256,
    signature,
    discrepancy,
    hexDump,
    analysisTimestamp: formatForensicDate(new Date()),
    durationMs: 0,
    hasSensitiveData: false,
    warnings: [],
    category: signature.category || 'unknown',
    metadata: {
      exif: null,
      pdf: null,
      office: null,
      archive: null,
      audio: null,
      video: null,
      perceptualHash: null,
    },
  };

  if (onProgress) onProgress('Extrayendo metadatos especializados...');

  // 1. Imágenes
  const isImageByExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'heic', 'avif'].includes(ext);
  const isImageBySig = signature.category === 'image';

  if (isImageByExt || isImageBySig) {
    try {
      const exif = await extractExifMetadata(arrayBuffer);
      forensicData.metadata.exif = exif;
      if (exif.hasSensitiveLocation) {
        forensicData.hasSensitiveData = true;
        forensicData.warnings.push('¡ADVERTENCIA FORENSE DE PRIVACIDAD! El archivo contiene coordenadas GPS exactas incrustadas.');
      }
    } catch (e) {
      console.warn('Error en extracción EXIF:', e);
    }

    try {
      // Calcular hash perceptual para comparación visual
      const pHash = await computeImagePerceptualHash(file);
      if (pHash.hash) {
        forensicData.metadata.perceptualHash = pHash.hash;
      }
    } catch (e) {
      console.warn('Error en cálculo pHash:', e);
    }
  }

  // 2. PDF
  const isPdf = ext === 'pdf' || signature.name.includes('PDF');
  if (isPdf) {
    try {
      const pdfMeta = await extractPdfMetadata(arrayBuffer);
      forensicData.metadata.pdf = pdfMeta;
    } catch (e) {
      console.warn('Error en extracción PDF:', e);
    }
  }

  // 3. Documentos Office (DOCX, XLSX, PPTX)
  const isOffice = ['docx', 'xlsx', 'pptx'].includes(ext) || signature.refinedType;
  if (isOffice) {
    try {
      const officeMeta = await extractOfficeMetadata(arrayBuffer, file.name);
      forensicData.metadata.office = officeMeta;
    } catch (e) {
      console.warn('Error en extracción Office:', e);
    }
  }

  // 4. Archivos Comprimidos ZIP / JAR / APK
  const isArchive = ['zip', 'jar', 'apk', 'epub'].includes(ext) || (signature.name.includes('ZIP') && !isOffice);
  if (isArchive) {
    try {
      const archiveMeta = await extractArchiveMetadata(arrayBuffer);
      forensicData.metadata.archive = archiveMeta;
    } catch (e) {
      console.warn('Error en extracción Archive:', e);
    }
  }

  // 5. Audio
  const isAudio = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext) || signature.category === 'audio';
  if (isAudio) {
    try {
      const id3 = parseID3Tags(arrayBuffer);
      const html5Audio = await probeHtml5Media(file, 'audio');
      forensicData.metadata.audio = {
        ...id3,
        duration: html5Audio.duration,
        durationFormatted: html5Audio.durationFormatted,
      };
    } catch (e) {
      console.warn('Error en extracción Audio:', e);
    }
  }

  // 6. Video
  const isVideo = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'].includes(ext) || signature.category === 'video';
  if (isVideo) {
    try {
      const mp4Atoms = parseMp4Atoms(arrayBuffer);
      const html5Video = await probeHtml5Media(file, 'video');
      forensicData.metadata.video = {
        ...mp4Atoms,
        duration: html5Video.duration,
        durationFormatted: html5Video.durationFormatted,
        width: html5Video.width,
        height: html5Video.height,
        resolution: html5Video.width && html5Video.height ? `${html5Video.width} × ${html5Video.height} px` : 'No disponible',
      };
    } catch (e) {
      console.warn('Error en extracción Video:', e);
    }
  }

  // Agregar discrepancias críticas a warnings
  if (discrepancy.hasDiscrepancy) {
    discrepancy.discrepancies.forEach((d) => forensicData.warnings.push(d));
  }

  const endTime = performance.now();
  forensicData.durationMs = Math.round(endTime - startTime);

  return forensicData;
}
