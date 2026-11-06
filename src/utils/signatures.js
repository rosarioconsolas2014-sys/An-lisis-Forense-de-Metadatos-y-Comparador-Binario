/**
 * Base de datos de firmas binarias (Magic Numbers) y detector de discrepancias forenses.
 */

export const MAGIC_SIGNATURES = [
  // Imágenes
  {
    name: 'JPEG Image',
    ext: ['jpg', 'jpeg', 'jpe', 'jif'],
    mime: 'image/jpeg',
    category: 'image',
    matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    signatureHex: 'FF D8 FF',
    description: 'Joint Photographic Experts Group (JPEG)',
  },
  {
    name: 'PNG Image',
    ext: ['png'],
    mime: 'image/png',
    category: 'image',
    matches: (bytes) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
    signatureHex: '89 50 4E 47 0D 0A 1A 0A',
    description: 'Portable Network Graphics (PNG)',
  },
  {
    name: 'GIF Image',
    ext: ['gif'],
    mime: 'image/gif',
    category: 'image',
    matches: (bytes) =>
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61,
    signatureHex: '47 49 46 38 37 61 / 47 49 46 38 39 61',
    description: 'Graphics Interchange Format (GIF87a / GIF89a)',
  },
  {
    name: 'WebP Image',
    ext: ['webp'],
    mime: 'image/webp',
    category: 'image',
    matches: (bytes) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
    signatureHex: '52 49 46 46 ?? ?? ?? ?? 57 45 42 50',
    description: 'Google WebP Image Format (RIFF....WEBP)',
  },
  {
    name: 'BMP Image',
    ext: ['bmp', 'dib'],
    mime: 'image/bmp',
    category: 'image',
    matches: (bytes) => bytes[0] === 0x42 && bytes[1] === 0x4d,
    signatureHex: '42 4D',
    description: 'Windows Bitmap Graphic (BM)',
  },
  {
    name: 'TIFF Image (Little Endian)',
    ext: ['tif', 'tiff'],
    mime: 'image/tiff',
    category: 'image',
    matches: (bytes) => bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00,
    signatureHex: '49 49 2A 00',
    description: 'Tagged Image File Format (Intel Little Endian)',
  },
  {
    name: 'TIFF Image (Big Endian)',
    ext: ['tif', 'tiff'],
    mime: 'image/tiff',
    category: 'image',
    matches: (bytes) => bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a,
    signatureHex: '4D 4D 00 2A',
    description: 'Tagged Image File Format (Motorola Big Endian)',
  },

  // Documentos
  {
    name: 'PDF Document',
    ext: ['pdf'],
    mime: 'application/pdf',
    category: 'document',
    matches: (bytes) => bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46,
    signatureHex: '25 50 44 46',
    description: 'Adobe Portable Document Format (%PDF)',
  },
  {
    name: 'ZIP / Office OpenXML',
    ext: ['zip', 'docx', 'xlsx', 'pptx', 'jar', 'apk', 'epub'],
    mime: 'application/zip',
    category: 'archive',
    matches: (bytes) =>
      (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x05 && bytes[3] === 0x06) ||
      (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x07 && bytes[3] === 0x08),
    signatureHex: '50 4B 03 04',
    description: 'ZIP Archive o Documento Office OpenXML (DOCX, XLSX, PPTX, APK, JAR)',
  },
  {
    name: 'Legacy Microsoft Office (OLE2 / DOC, XLS, PPT)',
    ext: ['doc', 'xls', 'ppt', 'msg'],
    mime: 'application/msword',
    category: 'document',
    matches: (bytes) =>
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0 &&
      bytes[4] === 0xa1 &&
      bytes[5] === 0xb1 &&
      bytes[6] === 0x1a &&
      bytes[7] === 0xe1,
    signatureHex: 'D0 CF 11 E0 A1 B1 1A E1',
    description: 'Microsoft Compound File Binary / OLE2 (DOC/XLS/PPT clásicos)',
  },

  // Comprimidos
  {
    name: 'RAR Archive (v4/v5)',
    ext: ['rar'],
    mime: 'application/x-rar-compressed',
    category: 'archive',
    matches: (bytes) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x61 &&
      bytes[2] === 0x72 &&
      bytes[3] === 0x21 &&
      bytes[4] === 0x1a &&
      bytes[5] === 0x07,
    signatureHex: '52 61 72 21 1A 07',
    description: 'Roshal ARchive (RAR)',
  },
  {
    name: '7-Zip Archive',
    ext: ['7z'],
    mime: 'application/x-7z-compressed',
    category: 'archive',
    matches: (bytes) =>
      bytes[0] === 0x37 &&
      bytes[1] === 0x7a &&
      bytes[2] === 0xbc &&
      bytes[3] === 0xaf &&
      bytes[4] === 0x27 &&
      bytes[5] === 0x1c,
    signatureHex: '37 7A BC AF 27 1C',
    description: '7-Zip Compressed File Format',
  },
  {
    name: 'GZIP Compressed',
    ext: ['gz', 'gzip'],
    mime: 'application/gzip',
    category: 'archive',
    matches: (bytes) => bytes[0] === 0x1f && bytes[1] === 0x8b,
    signatureHex: '1F 8B',
    description: 'GNU Zip Compressed Archive',
  },
  {
    name: 'TAR Archive',
    ext: ['tar'],
    mime: 'application/x-tar',
    category: 'archive',
    matches: (bytes) =>
      bytes.length > 262 &&
      bytes[257] === 0x75 &&
      bytes[258] === 0x73 &&
      bytes[259] === 0x74 &&
      bytes[260] === 0x61 &&
      bytes[261] === 0x72,
    signatureHex: 'Offset 257: 75 73 74 61 72',
    description: 'Tape Archive (POSIX ustar)',
  },

  // Audio & Video
  {
    name: 'MP3 Audio (ID3v2 Tagged)',
    ext: ['mp3'],
    mime: 'audio/mpeg',
    category: 'audio',
    matches: (bytes) => bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33,
    signatureHex: '49 44 33',
    description: 'MPEG-1 Audio Layer III con contenedor ID3v2 (ID3)',
  },
  {
    name: 'MP3 Audio (Raw Frame Sync)',
    ext: ['mp3'],
    mime: 'audio/mpeg',
    category: 'audio',
    matches: (bytes) => bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0,
    signatureHex: 'FF FB / FF F3 / FF F2',
    description: 'MPEG Audio Raw Sync Frame Header',
  },
  {
    name: 'FLAC Audio',
    ext: ['flac'],
    mime: 'audio/flac',
    category: 'audio',
    matches: (bytes) => bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43,
    signatureHex: '66 4C 61 43',
    description: 'Free Lossless Audio Codec (fLaC)',
  },
  {
    name: 'OGG Container / Vorbis / Opus',
    ext: ['ogg', 'oga', 'ogv', 'opus'],
    mime: 'audio/ogg',
    category: 'audio',
    matches: (bytes) => bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53,
    signatureHex: '4F 67 67 53',
    description: 'Ogg Encapsulation Container (OggS)',
  },
  {
    name: 'WAV Audio',
    ext: ['wav'],
    mime: 'audio/wav',
    category: 'audio',
    matches: (bytes) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45,
    signatureHex: '52 49 46 46 ?? ?? ?? ?? 57 41 56 45',
    description: 'Waveform Audio File Format (RIFF....WAVE)',
  },
  {
    name: 'MP4 / QuickTime Video / Audio',
    ext: ['mp4', 'm4a', 'm4v', 'mov'],
    mime: 'video/mp4',
    category: 'video',
    matches: (bytes) =>
      (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) ||
      (bytes[4] === 0x6d && bytes[5] === 0x6f && bytes[6] === 0x6f && bytes[7] === 0x76),
    signatureHex: 'Offset 4: 66 74 79 70 (ftyp) o 6D 6F 6F 76 (moov)',
    description: 'ISO Media Format / Apple QuickTime / MP4',
  },
  {
    name: 'MKV / WebM Video Container',
    ext: ['mkv', 'webm'],
    mime: 'video/x-matroska',
    category: 'video',
    matches: (bytes) => bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3,
    signatureHex: '1A 45 DF A3',
    description: 'Matroska / WebM EBML Container',
  },
  {
    name: 'AVI Video Container',
    ext: ['avi'],
    mime: 'video/x-msvideo',
    category: 'video',
    matches: (bytes) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x41 &&
      bytes[9] === 0x56 &&
      bytes[10] === 0x49 &&
      bytes[11] === 0x20,
    signatureHex: '52 49 46 46 ?? ?? ?? ?? 41 56 49 20',
    description: 'Audio Video Interleave (RIFF....AVI )',
  },

  // Binarios y Ejecutables
  {
    name: 'Windows Executable / DLL (PE)',
    ext: ['exe', 'dll', 'sys', 'scr', 'ocx'],
    mime: 'application/x-msdownload',
    category: 'executable',
    matches: (bytes) => bytes[0] === 0x4d && bytes[1] === 0x5a,
    signatureHex: '4D 5A',
    description: 'DOS MZ Executable / Microsoft Windows PE',
  },
  {
    name: 'Linux ELF Executable',
    ext: ['elf', 'bin', 'so'],
    mime: 'application/x-executable',
    category: 'executable',
    matches: (bytes) => bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46,
    signatureHex: '7F 45 4C 46',
    description: 'Executable and Linkable Format (ELF)',
  },
  {
    name: 'macOS Mach-O Binary (64-bit)',
    ext: ['dylib', 'bin'],
    mime: 'application/x-mach-binary',
    category: 'executable',
    matches: (bytes) =>
      (bytes[0] === 0xcf && bytes[1] === 0xfa && bytes[2] === 0xed && bytes[3] === 0xfe) ||
      (bytes[0] === 0xfe && bytes[1] === 0xed && bytes[2] === 0xfa && bytes[3] === 0xcf),
    signatureHex: 'CF FA ED FE / FE ED FA CF',
    description: 'Mach-O binary format (macOS / iOS)',
  },
  {
    name: 'WebAssembly Binary',
    ext: ['wasm'],
    mime: 'application/wasm',
    category: 'executable',
    matches: (bytes) => bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d,
    signatureHex: '00 61 73 6D',
    description: 'WebAssembly Binary Format (\\0asm)',
  },
  {
    name: 'SQLite 3 Database',
    ext: ['sqlite', 'db', 'sqlite3'],
    mime: 'application/vnd.sqlite3',
    category: 'database',
    matches: (bytes) =>
      bytes[0] === 0x53 &&
      bytes[1] === 0x51 &&
      bytes[2] === 0x4c &&
      bytes[3] === 0x69 &&
      bytes[4] === 0x74 &&
      bytes[5] === 0x65 &&
      bytes[6] === 0x20 &&
      bytes[7] === 0x66,
    signatureHex: '53 51 4C 69 74 65 20 66 (SQLite format 3)',
    description: 'SQLite 3 Database File',
  },
];

/**
 * Identifica la firma binaria de un archivo a partir de los primeros bytes
 * @param {Uint8Array} headerBytes
 * @param {string} fileName
 * @returns {object}
 */
export function identifyBinarySignature(headerBytes, fileName = '') {
  if (!headerBytes || headerBytes.length === 0) {
    return {
      identified: false,
      name: 'Archivo vacío o inaccesible',
      category: 'unknown',
      signatureHex: '00',
      description: 'Sin bytes disponibles para análisis de firma',
    };
  }

  for (const sig of MAGIC_SIGNATURES) {
    try {
      if (sig.matches(headerBytes)) {
        // Refinamiento especial para ZIP / DOCX / XLSX / PPTX
        if (sig.name === 'ZIP / Office OpenXML') {
          const lowerName = fileName.toLowerCase();
          if (lowerName.endsWith('.docx')) {
            return {
              ...sig,
              name: 'Microsoft Word Document (DOCX - OpenXML)',
              category: 'document',
              refinedType: 'docx',
            };
          }
          if (lowerName.endsWith('.xlsx')) {
            return {
              ...sig,
              name: 'Microsoft Excel Spreadsheet (XLSX - OpenXML)',
              category: 'spreadsheet',
              refinedType: 'xlsx',
            };
          }
          if (lowerName.endsWith('.pptx')) {
            return {
              ...sig,
              name: 'Microsoft PowerPoint Presentation (PPTX - OpenXML)',
              category: 'presentation',
              refinedType: 'pptx',
            };
          }
        }
        return {
          ...sig,
          identified: true,
        };
      }
    } catch {
      // Ignorar errores de acceso a índices
    }
  }

  // Detección de texto plano / JSON / XML UTF-8
  const isAsciiText = checkAsciiText(headerBytes);
  if (isAsciiText) {
    const textSample = new TextDecoder('utf-8', { fatal: false }).decode(headerBytes.slice(0, 100));
    if (textSample.trim().startsWith('{') || textSample.trim().startsWith('[')) {
      return {
        identified: true,
        name: 'JSON Document',
        ext: ['json'],
        mime: 'application/json',
        category: 'text',
        signatureHex: '7B / 5B (ASCII text)',
        description: 'JavaScript Object Notation',
      };
    }
    if (textSample.toLowerCase().includes('<?xml')) {
      return {
        identified: true,
        name: 'XML Document',
        ext: ['xml'],
        mime: 'application/xml',
        category: 'text',
        signatureHex: '3C 3F 78 6D 6C (<?xml)',
        description: 'eXtensible Markup Language',
      };
    }
    if (textSample.toLowerCase().includes('<!doctype html') || textSample.toLowerCase().includes('<html')) {
      return {
        identified: true,
        name: 'HTML Document',
        ext: ['html', 'htm'],
        mime: 'text/html',
        category: 'text',
        signatureHex: '3C 21 44 4F / 3C 68 74 (ASCII)',
        description: 'HyperText Markup Language',
      };
    }
    return {
      identified: true,
      name: 'Plain Text Document / Source Code',
      ext: ['txt', 'csv', 'log', 'md', 'js', 'py', 'c', 'cpp'],
      mime: 'text/plain',
      category: 'text',
      signatureHex: 'Caracteres imprimibles UTF-8/ASCII',
      description: 'Archivo de texto legible',
    };
  }

  return {
    identified: false,
    name: 'Formato Binario No Catalogado',
    ext: [],
    mime: 'application/octet-stream',
    category: 'binary',
    signatureHex: formatHexRow(headerBytes.slice(0, 8)),
    description: 'Estructura binaria sin coincidencia en la base de números mágicos',
  };
}

/**
 * Evalúa si los primeros bytes corresponden a texto ASCII / UTF-8 legible
 */
function checkAsciiText(bytes) {
  if (bytes.length === 0) return false;
  const sample = bytes.slice(0, Math.min(bytes.length, 128));
  let printableCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    // Tab, LF, CR, o imprimibles ASCII estándar (32-126) o UTF-8 multibyte (> 127)
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126) || b >= 128) {
      printableCount++;
    } else if (b === 0) {
      return false; // Bytes nulos en encabezado implican binario
    }
  }
  return printableCount / sample.length > 0.9;
}

/**
 * Convierte un arreglo de bytes en representación hexadecimal separada por espacios
 */
export function formatHexRow(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

/**
 * Analiza posibles discrepancias forenses entre Extensión declarada, MIME detectado por navegador y Firma binaria real.
 * @param {string} fileName
 * @param {string} reportedMime
 * @param {object} detectedSignature
 * @returns {object} Discrepancy analysis result
 */
export function analyzeForensicDiscrepancies(fileName, reportedMime, detectedSignature) {
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  const discrepancies = [];
  let severity = 'none'; // 'none' | 'warning' | 'critical'

  if (!detectedSignature || !detectedSignature.identified) {
    return {
      hasDiscrepancy: false,
      severity: 'none',
      discrepancies: [
        'Firma binaria no estándar o formato genérico. No se puede confirmar ni refutar coincidencia con la extensión.',
      ],
      extension: ext,
      reportedMime: reportedMime || 'No especificado',
      detectedType: detectedSignature ? detectedSignature.name : 'Desconocido',
    };
  }

  // 1. Peligro crítico: ejecutable con extensión de imagen/documento
  if (detectedSignature.category === 'executable') {
    const innocentExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'pdf', 'txt', 'docx', 'xlsx', 'mp3', 'mp4'];
    if (innocentExts.includes(ext)) {
      discrepancies.push(
        `ALERTA FORENSE CRÍTICA: El archivo tiene extensión "${ext.toUpperCase()}" pero su firma binaria corresponde a un EJECUTABLE (${detectedSignature.name}). Posible técnica de camuflaje de malware (Masquerading / Double Extension).`
      );
      severity = 'critical';
    }
  }

  // 2. Discrepancia de extensión frente a la firma
  if (detectedSignature.ext && detectedSignature.ext.length > 0) {
    if (!detectedSignature.ext.includes(ext)) {
      // Excepciones conocidas: docx/xlsx son archivos zip internamente
      const isOfficeZip =
        ['docx', 'xlsx', 'pptx'].includes(ext) &&
        (detectedSignature.name.includes('ZIP') || detectedSignature.name.includes('Office'));

      if (!isOfficeZip) {
        discrepancies.push(
          `Discrepancia de extensión: La extensión declarada es ".${ext}", pero la firma binaria corresponde a ${detectedSignature.name} (esperado: ${detectedSignature.ext.map((e) => '.' + e).join(', ')}).`
        );
        if (severity !== 'critical') severity = 'warning';
      }
    }
  }

  // 3. Discrepancia de MIME frente a la firma
  if (reportedMime && detectedSignature.mime) {
    const normReported = reportedMime.toLowerCase().trim();
    const normDetected = detectedSignature.mime.toLowerCase().trim();

    // Comprobamos si el grupo principal difiere (ej: image/ vs application/)
    const reportedGroup = normReported.split('/')[0];
    const detectedGroup = normDetected.split('/')[0];

    if (reportedGroup && detectedGroup && reportedGroup !== detectedGroup && reportedGroup !== 'application') {
      discrepancies.push(
        `Discrepancia de MIME Type: El navegador reporta "${reportedMime}", pero la firma binaria corresponde a categoría "${detectedGroup}" (${normDetected}).`
      );
      if (severity !== 'critical') severity = 'warning';
    }
  }

  return {
    hasDiscrepancy: discrepancies.length > 0,
    severity,
    discrepancies: discrepancies.length > 0 ? discrepancies : ['La extensión, tipo MIME y firma binaria son consistentes.'],
    extension: ext,
    reportedMime: reportedMime || 'No reportado por el navegador',
    detectedType: detectedSignature.name,
    signatureHex: detectedSignature.signatureHex,
  };
}
