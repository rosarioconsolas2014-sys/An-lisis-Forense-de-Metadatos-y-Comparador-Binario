/**
 * Extractor de metadatos forenses para documentos Microsoft Office OpenXML (Word .docx, Excel .xlsx, PowerPoint .pptx).
 * Descomprime internamente los descriptores XML (docProps/core.xml y docProps/app.xml) usando JSZip.
 */
import JSZip from 'jszip';
import { formatForensicDate } from './crypto.js';

/**
 * Extrae metadatos de documentos DOCX, XLSX y PPTX
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 * @returns {Promise<object>}
 */
export async function extractOfficeMetadata(buffer, fileName = '') {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const result = {
      available: false,
      docType: 'Office OpenXML',
      core: {
        title: 'No disponible',
        creator: 'No disponible',
        lastModifiedBy: 'No disponible',
        created: 'No disponible',
        modified: 'No disponible',
        revision: 'No disponible',
        subject: 'No disponible',
        description: 'No disponible',
      },
      app: {
        application: 'No disponible',
        appVersion: 'No disponible',
        totalTimeMinutes: 'No disponible',
        company: 'No disponible',
        pages: 'No disponible',
        words: 'No disponible',
        characters: 'No disponible',
        paragraphs: 'No disponible',
        lines: 'No disponible',
      },
      sheets: [],
      slideCount: null,
      internalFilesCount: Object.keys(zip.files).length,
    };

    const parser = new DOMParser();

    // 1. Leer docProps/core.xml
    const coreFile = zip.file('docProps/core.xml');
    if (coreFile) {
      const coreXmlText = await coreFile.async('text');
      const xmlDoc = parser.parseFromString(coreXmlText, 'application/xml');

      const getText = (tagNames) => {
        for (const tag of tagNames) {
          const el = xmlDoc.getElementsByTagName(tag)[0];
          if (el && el.textContent) return el.textContent.trim();
        }
        return 'No disponible';
      };

      result.core.title = getText(['dc:title', 'title']);
      result.core.creator = getText(['dc:creator', 'creator']);
      result.core.lastModifiedBy = getText(['cp:lastModifiedBy', 'lastModifiedBy']);
      result.core.subject = getText(['dc:subject', 'subject']);
      result.core.description = getText(['dc:description', 'description']);
      result.core.revision = getText(['cp:revision', 'revision']);

      const createdRaw = getText(['dcterms:created', 'created']);
      if (createdRaw !== 'No disponible') {
        result.core.created = formatForensicDate(createdRaw);
      }

      const modifiedRaw = getText(['dcterms:modified', 'modified']);
      if (modifiedRaw !== 'No disponible') {
        result.core.modified = formatForensicDate(modifiedRaw);
      }

      result.available = true;
    }

    // 2. Leer docProps/app.xml
    const appFile = zip.file('docProps/app.xml');
    if (appFile) {
      const appXmlText = await appFile.async('text');
      const xmlDoc = parser.parseFromString(appXmlText, 'application/xml');

      const getText = (tagName) => {
        const el = xmlDoc.getElementsByTagName(tagName)[0];
        return el && el.textContent ? el.textContent.trim() : 'No disponible';
      };

      result.app.application = getText('Application');
      result.app.appVersion = getText('AppVersion');
      result.app.company = getText('Company');
      result.app.pages = getText('Pages');
      result.app.words = getText('Words');
      result.app.characters = getText('Characters');
      result.app.paragraphs = getText('Paragraphs');
      result.app.lines = getText('Lines');

      const totalTime = getText('TotalTime');
      if (totalTime !== 'No disponible') {
        result.app.totalTimeMinutes = `${totalTime} minutos`;
      }

      result.available = true;
    }

    // 3. Si es Excel, extraer hojas de cálculo de xl/workbook.xml
    const workbookFile = zip.file('xl/workbook.xml');
    if (workbookFile) {
      result.docType = 'Microsoft Excel (XLSX)';
      const wbXml = await workbookFile.async('text');
      const xmlDoc = parser.parseFromString(wbXml, 'application/xml');
      const sheetEls = xmlDoc.getElementsByTagName('sheet');
      const sheetsList = [];
      for (let i = 0; i < sheetEls.length; i++) {
        const name = sheetEls[i].getAttribute('name');
        if (name) sheetsList.push(name);
      }
      result.sheets = sheetsList;
    }

    // 4. Si es PowerPoint, contar diapositivas
    const pptPresFile = zip.file('ppt/presentation.xml');
    if (pptPresFile) {
      result.docType = 'Microsoft PowerPoint (PPTX)';
      const pptXml = await pptPresFile.async('text');
      const xmlDoc = parser.parseFromString(pptXml, 'application/xml');
      const slideEls = xmlDoc.getElementsByTagName('p:sldId');
      result.slideCount = slideEls.length;
    }

    // 5. Si es Word
    if (zip.file('word/document.xml')) {
      result.docType = 'Microsoft Word (DOCX)';
    }

    return result;
  } catch (err) {
    console.warn('Error leyendo paquete Office OpenXML:', err);
    return {
      available: false,
      error: 'No se pudieron extraer propiedades internas del archivo Office (posible formato legado binario .doc/.xls o estructura protegida).',
    };
  }
}
