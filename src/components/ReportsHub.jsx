import React, { useState } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Printer,
  FileSpreadsheet,
  FileCode,
  FileArchive,
} from 'lucide-react';
import { exportToPdf, exportToTxt, exportToJson, exportToCsv } from '../utils/reportGenerator.js';

/**
 * @param {object} props
 * @param {any[]} [props.sessionFiles]
 */
export default function ReportsHub({ sessionFiles = [] }) {
  const [caseNumber, setCaseNumber] = useState('EXP-FORENSE-2026-01');
  const [examiner, setExaminer] = useState('Perito Forense Digital');
  const [notes, setNotes] = useState('Inspección de autenticidad, integridad de hashes SHA-256 y extracción de metadatos profundos.');
  const [selectedFileIds, setSelectedFileIds] = useState(() => sessionFiles.map((f) => f.id));

  const toggleSelect = (id) => {
    if (selectedFileIds.includes(id)) {
      setSelectedFileIds(selectedFileIds.filter((item) => item !== id));
    } else {
      setSelectedFileIds([...selectedFileIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedFileIds(sessionFiles.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedFileIds([]);
  };

  const filesToExport = sessionFiles.filter((f) => selectedFileIds.includes(f.id));

  const handleExport = (format) => {
    if (filesToExport.length === 0) return;
    const meta = { caseNumber, examiner, notes };

    if (format === 'pdf') {
      exportToPdf(filesToExport, `informe_${caseNumber}.pdf`, meta);
    } else if (format === 'txt') {
      exportToTxt(filesToExport, `informe_${caseNumber}.txt`, meta);
    } else if (format === 'json') {
      exportToJson(
        {
          caseMetadata: meta,
          files: filesToExport,
        },
        `informe_${caseNumber}.json`
      );
    } else if (format === 'csv') {
      exportToCsv(filesToExport, `resumen_${caseNumber}.csv`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <span>Centro de Informes y Exportaciones Periciales</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Generación de dictámenes periciales y reportes técnicos en múltiples formatos oficiales con sellado de integridad SHA-256.
        </p>
      </div>

      {/* Case Details Form */}
      <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Datos de la Pericia / Expediente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nº de Expediente / Caso</label>
            <input
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              className="w-full bg-[#091122] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Perito / Analista Responsable</label>
            <input
              type="text"
              value={examiner}
              onChange={(e) => setExaminer(e.target.value)}
              className="w-full bg-[#091122] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-400 mb-1 font-medium">Notas Técnicas / Conclusiones del Peritaje</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#091122] border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* File Selection */}
      <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Selección de Evidencias a Incluir en el Informe ({filesToExport.length} de {sessionFiles.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Marque las evidencias analizadas que formarán parte del reporte formal.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={selectAll}
              className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              Seleccionar Todos
            </button>
            <button
              onClick={deselectAll}
              className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700"
            >
              Deseleccionar
            </button>
          </div>
        </div>

        {sessionFiles.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No hay archivos analizados en la sesión actual. Analice archivos previamente para generar informes.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
            {sessionFiles.map((f) => {
              const isSelected = selectedFileIds.includes(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleSelect(f.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 text-xs ${
                    isSelected
                      ? 'bg-sky-950/30 border-sky-500/40 text-sky-100'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-sky-500 focus:ring-0"
                  />
                  <div className="truncate flex-1">
                    <div className="font-semibold truncate">{f.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{f.readableSize}</span>
                      <span>·</span>
                      <span>{f.extension}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Formats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PDF Card */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Informe PDF Oficial</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Documento pericial formal con membrete institucional, tablas de propiedades y hashes criptográficos.
            </p>
          </div>
          <button
            onClick={() => handleExport('pdf')}
            disabled={filesToExport.length === 0}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>

        {/* TXT Card */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Acta en Texto Plano (TXT)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formato monospaciado ASCII con cadena de custodia criptográfica apto para expedientes judiciales.
            </p>
          </div>
          <button
            onClick={() => handleExport('txt')}
            disabled={filesToExport.length === 0}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar TXT</span>
          </button>
        </div>

        {/* CSV Card */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Planilla Tabular (CSV)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compatible con Microsoft Excel, LibreOffice Calc o bases de datos de inventario forense.
            </p>
          </div>
          <button
            onClick={() => handleExport('csv')}
            disabled={filesToExport.length === 0}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>

        {/* JSON Card */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCode className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Estructurado (JSON)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exportación técnica completa con todos los metadatos brutos para automatización o integración API.
            </p>
          </div>
          <button
            onClick={() => handleExport('json')}
            disabled={filesToExport.length === 0}
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
