/**
 * Extractor de estructura interna para archivos comprimidos (ZIP, JAR, APK, etc.).
 * Utiliza JSZip para listar archivos, tamaños reales, ratios de compresión y marcas temporales internas.
 */
import JSZip from 'jszip';
import { formatReadableSize, formatForensicDate } from './crypto.js';

/**
 * Inspecciona el contenido interno de un archivo comprimido
 * @param {ArrayBuffer} buffer
 * @returns {Promise<object>}
 */
export async function extractArchiveMetadata(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const files = [];
    let totalUncompressed = 0;
    let directoryCount = 0;
    let fileCount = 0;

    const fileEntries = Object.values(zip.files);

    for (const entry of fileEntries) {
      if (entry.dir) {
        directoryCount++;
      } else {
        fileCount++;
      }

      // Información de tamaño
      const uncompressedSize = entry._data ? entry._data.uncompressedSize || 0 : 0;
      totalUncompressed += uncompressedSize;

      files.push({
        name: entry.name,
        isDirectory: entry.dir,
        uncompressedSize,
        readableSize: entry.dir ? 'Directorio' : formatReadableSize(uncompressedSize),
        date: entry.date ? formatForensicDate(entry.date) : 'No disponible',
        comment: entry.comment || null,
      });
    }

    // Ordenar: primero carpetas, luego archivos alfabéticamente
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      available: true,
      format: 'ZIP Archive',
      totalEntries: fileEntries.length,
      fileCount,
      directoryCount,
      totalUncompressedBytes: totalUncompressed,
      readableTotalUncompressed: formatReadableSize(totalUncompressed),
      archiveComment: zip.comment || 'Sin comentarios de archivo',
      files: files.slice(0, 150), // Limitar a los primeros 150 para optimización visual
      hasMoreFiles: files.length > 150,
      totalInternalFiles: files.length,
    };
  } catch (err) {
    console.warn('Error leyendo archivo ZIP:', err);
    return {
      available: false,
      error: 'No se pudo descomprimir el archivo. Puede tratarse de un formato no compatible (como RAR/7Z sin cabecera estándar) o estar dañado/cifrado con contraseña.',
    };
  }
}
