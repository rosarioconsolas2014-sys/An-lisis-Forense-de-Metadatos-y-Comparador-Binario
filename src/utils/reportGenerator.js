/**
 * Generador de informes forenses exportables en formatos TXT, CSV, JSON y PDF.
 * Genera informes profesionales con cadena de custodia criptográfica y advertencias de discrepancia.
 */
import { jsPDF } from 'jspdf';
import { formatForensicDate } from './crypto.js';

/**
 * Descarga una cadena de texto o Blob como archivo en el navegador
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exporta resultados en formato JSON estructurado
 * @param {object|Array} data
 * @param {string} filename
 */
export function exportToJson(data, filename = 'informe_forense.json') {
  const jsonContent = JSON.stringify(
    {
      app: 'Analizador Forense de Archivos',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      disclaimer: 'Análisis forense generado en sandbox local del navegador sin transmisión a servidores externos.',
      records: data,
    },
    null,
    2
  );

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exporta un listado de archivos en formato CSV tabular
 * @param {Array<object>} files
 * @param {string} filename
 */
export function exportToCsv(files, filename = 'resumen_forense.csv') {
  const headers = [
    'Índice',
    'Nombre',
    'Extensión',
    'Tamaño (Bytes)',
    'Tamaño Legible',
    'Tipo MIME',
    'Última Modificación',
    'Firma Detectada',
    'Encabezado Hex',
    'Hash SHA-256',
    'Discrepancia Forense',
    'Advertencias',
  ];

  const rows = files.map((f, i) => [
    i + 1,
    `"${(f.name || '').replace(/"/g, '""')}"`,
    `"${(f.extension || '').replace(/"/g, '""')}"`,
    f.sizeBytes,
    `"${f.readableSize || ''}"`,
    `"${(f.mimeType || '').replace(/"/g, '""')}"`,
    `"${(f.lastModified || '').replace(/"/g, '""')}"`,
    `"${(f.signature?.name || '').replace(/"/g, '""')}"`,
    `"${(f.signature?.signatureHex || '').replace(/"/g, '""')}"`,
    `"${f.sha256 || ''}"`,
    `"${f.discrepancy?.hasDiscrepancy ? 'SI (' + f.discrepancy.severity + ')' : 'NO'}"`,
    `"${(f.warnings || []).join('; ').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exporta un informe formal en texto plano con formato forense monospaciado
 * @param {object|Array<object>} data
 * @param {string} filename
 * @param {object} [meta] { caseNumber, examiner, notes }
 */
export function exportToTxt(data, filename = 'informe_forense.txt', meta = {}) {
  const isBatch = Array.isArray(data);
  const files = isBatch ? data : [data];
  const timestamp = formatForensicDate(new Date());

  const lines = [];
  lines.push('================================================================================');
  lines.push('                   INFORME DE ANÁLISIS FORENSE DIGITAL                          ');
  lines.push('                     ANALIZADOR FORENSE DE ARCHIVOS                             ');
  lines.push('================================================================================');
  lines.push(`FECHA Y HORA DEL REPORTE : ${timestamp}`);
  lines.push(`CASO / EXPEDIENTE        : ${meta.caseNumber || 'NO ESPECIFICADO'}`);
  lines.push(`PERITO / OPERADOR        : ${meta.examiner || 'ANALISTA FORENSE'}`);
  lines.push(`TOTAL DE EVIDENCIAS      : ${files.length} archivo(s) analizado(s)`);
  if (meta.notes) {
    lines.push(`NOTAS DEL CASO           : ${meta.notes}`);
  }
  lines.push('--------------------------------------------------------------------------------');
  lines.push('GARANTÍA DE INTEGRIDAD: Procesamiento 100% local en cliente. Algoritmo SHA-256.');
  lines.push('================================================================================\n');

  files.forEach((f, idx) => {
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`EVIDENCIA DIGITAL #${idx + 1}: ${f.name}`);
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`Nombre Original        : ${f.name}`);
    lines.push(`Extensión Declarada    : ${f.extension}`);
    lines.push(`Tamaño Exacto          : ${f.sizeBytes} bytes (${f.readableSize})`);
    lines.push(`MIME Type Reportado    : ${f.mimeType}`);
    lines.push(`Fecha Última Modif.    : ${f.lastModified}`);
    lines.push(`Firma Binaria Real     : ${f.signature?.name || 'Desconocida'}`);
    lines.push(`Encabezado Mágico (Hex): ${f.signature?.signatureHex || 'N/A'}`);
    lines.push(`Firma Criptográfica    :`);
    lines.push(`   SHA-256: ${f.sha256}`);

    // Discrepancias
    if (f.discrepancy?.hasDiscrepancy) {
      lines.push(`\n[!] ADVERTENCIA DE DISCREPANCIA / ANOMALÍA:`);
      f.discrepancy.discrepancies.forEach((d) => lines.push(`    * ${d}`));
    } else {
      lines.push(`\n[+] Verificación de Integridad: Extensión, MIME y firma binaria son consistentes.`);
    }

    // Advertencias de Privacidad / GPS
    if (f.hasSensitiveData) {
      lines.push(`\n[!] ALERTA DE PRIVACIDAD: Contiene metadatos de geolocalización o datos personales.`);
    }

    // Metadatos Específicos
    if (f.metadata?.exif?.available) {
      lines.push(`\n--- METADATOS EXIF (IMAGEN) ---`);
      const cam = f.metadata.exif.camera;
      const cap = f.metadata.exif.capture;
      lines.push(`Cámara / Fabricante   : ${cam.make || 'N/A'} - ${cam.model || 'N/A'}`);
      lines.push(`Software Utilizado     : ${cam.software || 'N/A'}`);
      lines.push(`Fecha Captura Original : ${cap.dateTimeOriginal || 'N/A'}`);
      lines.push(`Resolución / Lente     : ${cap.width}x${cap.height} px | Lente: ${cam.lens || 'N/A'}`);
      if (f.metadata.exif.gps) {
        lines.push(`Coordenadas GPS        : Lat ${f.metadata.exif.gps.latitude}, Lon ${f.metadata.exif.gps.longitude}`);
        lines.push(`Enlace Satelital       : ${f.metadata.exif.gps.mapsUrl}`);
      }
    }

    if (f.metadata?.pdf?.available) {
      lines.push(`\n--- METADATOS DOCUMENTO PDF ---`);
      lines.push(`Título                 : ${f.metadata.pdf.title}`);
      lines.push(`Autor                  : ${f.metadata.pdf.author}`);
      lines.push(`Creador / Aplicación   : ${f.metadata.pdf.creator}`);
      lines.push(`Productor              : ${f.metadata.pdf.producer}`);
      lines.push(`Fecha Creación Interna : ${f.metadata.pdf.creationDate}`);
      lines.push(`Páginas                : ${f.metadata.pdf.pageCount}`);
    }

    if (f.metadata?.office?.available) {
      lines.push(`\n--- METADATOS OFFICE OPENXML ---`);
      lines.push(`Autor                  : ${f.metadata.office.core.creator}`);
      lines.push(`Último Modificador     : ${f.metadata.office.core.lastModifiedBy}`);
      lines.push(`Aplicación Generadora  : ${f.metadata.office.app.application}`);
      lines.push(`Fecha Creación Interna : ${f.metadata.office.core.created}`);
      lines.push(`Fecha Modif. Interna   : ${f.metadata.office.core.modified}`);
      if (f.metadata.office.sheets?.length > 0) {
        lines.push(`Hojas de Cálculo       : ${f.metadata.office.sheets.join(', ')}`);
      }
    }

    if (f.metadata?.audio?.hasID3) {
      lines.push(`\n--- ETIQUETAS ID3 (AUDIO) ---`);
      lines.push(`Título                 : ${f.metadata.audio.title || 'N/A'}`);
      lines.push(`Artista                : ${f.metadata.audio.artist || 'N/A'}`);
      lines.push(`Álbum                  : ${f.metadata.audio.album || 'N/A'}`);
      lines.push(`Año                    : ${f.metadata.audio.year || 'N/A'}`);
      lines.push(`Duración               : ${f.metadata.audio.durationFormatted || 'N/A'}`);
    }

    if (f.metadata?.video?.isMp4 || f.metadata?.video?.resolution !== 'No disponible') {
      lines.push(`\n--- METADATOS VIDEO ---`);
      lines.push(`Resolución             : ${f.metadata.video?.resolution || 'N/A'}`);
      lines.push(`Duración               : ${f.metadata.video?.durationFormatted || 'N/A'}`);
      lines.push(`Fecha Creación Atómica : ${f.metadata.video?.creationDate || 'N/A'}`);
      lines.push(`Códecs Detectados      : ${f.metadata.video?.codecs?.join(', ') || 'N/A'}`);
    }

    lines.push('\n');
  });

  lines.push('================================================================================');
  lines.push('                        FIN DEL INFORME FORENSE                                 ');
  lines.push('================================================================================');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exporta un informe formal en PDF profesional utilizando jsPDF
 * @param {object|Array<object>} data
 * @param {string} filename
 * @param {object} [meta]
 */
export function exportToPdf(data, filename = 'informe_forense.pdf', meta = {}) {
  const isBatch = Array.isArray(data);
  const files = isBatch ? data : [data];
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = 18;

  // Encabezado técnico
  doc.setFillColor(11, 19, 41); // Navy #0b1329
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(56, 189, 248); // Cyan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ANALIZADOR FORENSE DE ARCHIVOS', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Informe Pericial de Metadatos, Firmas e Integridad Criptográfica', 14, 18);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(8);
  doc.text(`Fecha: ${formatForensicDate(new Date())}  |  Caso: ${meta.caseNumber || 'N/D'}  |  Perito: ${meta.examiner || 'Forense Digital'}`, 14, 24);

  y = 36;

  files.forEach((f, idx) => {
    // Si queda poco espacio, nueva página
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    // Cabecera de evidencia
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`EVIDENCIA DIGITAL #${idx + 1}: ${f.name}`, 16, y + 5);
    y += 11;

    // Tabla de propiedades clave
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85); // Slate 700

    const printKV = (k, v, isAlert = false) => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`${k}:`, 16, y);
      doc.setFont('helvetica', isAlert ? 'bold' : 'normal');
      doc.setTextColor(isAlert ? 220 : 15, isAlert ? 38 : 23, isAlert ? 38 : 42);
      doc.text(String(v || 'N/D'), 62, y);
      y += 5;
    };

    printKV('Nombre', f.name);
    printKV('Extensión / MIME', `${f.extension}  |  ${f.mimeType}`);
    printKV('Tamaño', `${f.sizeBytes.toLocaleString('es-ES')} bytes (${f.readableSize})`);
    printKV('Firma Binaria', `${f.signature?.name || 'Desconocida'} (${f.signature?.signatureHex || 'N/A'})`);
    printKV('Hash SHA-256', f.sha256);
    printKV('Modificación', f.lastModified);

    if (f.discrepancy?.hasDiscrepancy) {
      printKV('Discrepancia', f.discrepancy.discrepancies.join(' '), true);
    }

    if (f.hasSensitiveData) {
      printKV('Privacidad', 'Contiene coordenadas GPS incrustadas en EXIF', true);
    }

    // Metadatos destacados
    if (f.metadata?.exif?.available) {
      const cam = f.metadata.exif.camera;
      printKV('Cámara / Software', `${cam.make || ''} ${cam.model || ''} | ${cam.software || 'N/D'}`);
      if (f.metadata.exif.gps) {
        printKV('GPS', `Lat: ${f.metadata.exif.gps.latitude}, Lon: ${f.metadata.exif.gps.longitude}`);
      }
    }

    if (f.metadata?.pdf?.available) {
      printKV('PDF Info', `Autor: ${f.metadata.pdf.author} | Creador: ${f.metadata.pdf.creator} | Páginas: ${f.metadata.pdf.pageCount}`);
    }

    if (f.metadata?.office?.available) {
      printKV('Office Info', `Autor: ${f.metadata.office.core.creator} | Modificado por: ${f.metadata.office.core.lastModifiedBy}`);
    }

    y += 4;
  });

  // Pie de página con descargo de responsabilidad
  if (y > pageHeight - 25) {
    doc.addPage();
    y = pageHeight - 20;
  } else {
    y = pageHeight - 15;
  }

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Aviso legal: Procesamiento 100% local en sandbox de navegador. Los metadatos reflejan estructuras internas del archivo analizado.', 14, y);

  doc.save(filename);
}
