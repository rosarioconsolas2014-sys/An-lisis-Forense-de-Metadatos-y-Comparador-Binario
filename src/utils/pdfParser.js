/**
 * Extractor de metadatos de documentos PDF utilizando pdf-lib.
 * Permite leer información del catálogo Info y contar páginas sin enviar datos al servidor.
 */
import { PDFDocument } from 'pdf-lib';
import { formatForensicDate } from './crypto.js';

/**
 * Extrae metadatos de un archivo PDF a partir de su ArrayBuffer
 * @param {ArrayBuffer} buffer
 * @returns {Promise<object>}
 */
export async function extractPdfMetadata(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || 'No disponible';
    const author = pdfDoc.getAuthor() || 'No disponible';
    const subject = pdfDoc.getSubject() || 'No disponible';
    const keywords = pdfDoc.getKeywords() || 'No disponible';
    const creator = pdfDoc.getCreator() || 'No disponible'; // Aplicación creadora
    const producer = pdfDoc.getProducer() || 'No disponible'; // Motor de conversión / biblioteca
    const creationDate = pdfDoc.getCreationDate() ? formatForensicDate(pdfDoc.getCreationDate()) : 'No disponible';
    const modificationDate = pdfDoc.getModificationDate() ? formatForensicDate(pdfDoc.getModificationDate()) : 'No disponible';

    // Intento de detección de versión PDF desde el encabezado inicial (%PDF-1.x)
    const headerBytes = new Uint8Array(buffer.slice(0, 15));
    let pdfVersion = 'PDF estándar';
    const headerStr = new TextDecoder('ascii').decode(headerBytes);
    const verMatch = headerStr.match(/%PDF-([0-9.]+)/);
    if (verMatch) {
      pdfVersion = `PDF v${verMatch[1]}`;
    }

    return {
      available: true,
      title,
      author,
      subject,
      keywords,
      creator,
      producer,
      creationDate,
      modificationDate,
      pageCount,
      pdfVersion,
      isEncrypted: pdfDoc.isEncrypted,
    };
  } catch (err) {
    console.warn('Error leyendo metadatos PDF:', err);
    // Intentar al menos extraer versión y encabezado
    try {
      const headerBytes = new Uint8Array(buffer.slice(0, 30));
      const headerStr = new TextDecoder('ascii').decode(headerBytes);
      const isPdf = headerStr.includes('%PDF');
      return {
        available: isPdf,
        error: isPdf ? 'El documento PDF está protegido o contiene estructuras corruptas.' : 'No es un documento PDF válido.',
        pdfVersion: isPdf ? 'Detectado por encabezado' : 'No disponible',
        pageCount: 'No disponible',
        author: 'No disponible',
        creator: 'No disponible',
        producer: 'No disponible',
        title: 'No disponible',
        creationDate: 'No disponible',
        modificationDate: 'No disponible',
        isEncrypted: true,
      };
    } catch {
      return {
        available: false,
        error: 'No se pudieron extraer metadatos del PDF.',
      };
    }
  }
}
