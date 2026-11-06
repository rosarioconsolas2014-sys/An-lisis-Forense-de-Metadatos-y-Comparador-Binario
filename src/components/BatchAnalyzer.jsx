import React, { useState, useRef, useMemo } from 'react';
import {
  Files,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Copy,
  Check,
  StopCircle,
} from 'lucide-react';
import { exportToCsv, exportToJson, exportToTxt, exportToPdf } from '../utils/reportGenerator.js';

/**
 * @param {object} props
 * @param {any[]} [props.batchFiles]
 * @param {boolean} [props.isProcessingBatch]
 * @param {number} [props.processedCount]
 * @param {number} [props.totalToProcess]
 * @param {any} [props.onUploadBatch]
 * @param {any} [props.onCancelBatch]
 * @param {any} [props.onViewFileDetail]
 */
export default function BatchAnalyzer({
  batchFiles = [],
  isProcessingBatch,
  processedCount = 0,
  totalToProcess = 0,
  onUploadBatch,
  onCancelBatch,
  onViewFileDetail,
}) {
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'duplicates' | 'discrepancies' | 'clean'
  const [copiedHash, setCopiedHash] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadBatch(Array.from(e.target.files));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadBatch(Array.from(e.dataTransfer.files));
    }
  };

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Identificar grupos de hashes duplicados
  const hashCounts = useMemo(() => {
    const counts = {};
    for (const f of batchFiles) {
      if (f.sha256) {
        counts[f.sha256] = (counts[f.sha256] || 0) + 1;
      }
    }
    return counts;
  }, [batchFiles]);

  // Filtrado y búsqueda
  const filteredFiles = useMemo(() => {
    return batchFiles.filter((f) => {
      const isDuplicate = hashCounts[f.sha256] > 1;
      const hasDiscrepancy = f.discrepancy?.hasDiscrepancy;

      if (filterType === 'duplicates' && !isDuplicate) return false;
      if (filterType === 'discrepancies' && !hasDiscrepancy) return false;
      if (filterType === 'clean' && (isDuplicate || hasDiscrepancy)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.extension.toLowerCase().includes(q) ||
        f.sha256?.toLowerCase().includes(q) ||
        f.signature?.name?.toLowerCase().includes(q)
      );
    });
  }, [batchFiles, hashCounts, filterType, searchQuery]);

  const duplicatesTotal = useMemo(() => {
    return batchFiles.filter((f) => hashCounts[f.sha256] > 1).length;
  }, [batchFiles, hashCounts]);

  const discrepanciesTotal = useMemo(() => {
    return batchFiles.filter((f) => f.discrepancy?.hasDiscrepancy).length;
  }, [batchFiles]);

  const progressPercent =
    totalToProcess > 0 ? Math.round((processedCount / totalToProcess) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Files className="w-5 h-5 text-purple-400" />
            <span>Módulo de Análisis Forense por Lotes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Procesamiento masivo con detección cruzada de duplicados y discrepancias de extensiones.
          </p>
        </div>

        {/* Actions & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingBatch}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar Lote de Archivos</span>
          </button>

          {isProcessingBatch && (
            <button
              onClick={onCancelBatch}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <StopCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Detener Proceso</span>
            </button>
          )}

          {batchFiles.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>Exportar Lote:</span>
              </span>
              <button
                onClick={() => exportToCsv(batchFiles, 'lote_forense.csv')}
                className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
                title="Exportar CSV de todo el lote"
              >
                CSV
              </button>
              <button
                onClick={() => exportToJson(batchFiles, 'lote_forense.json')}
                className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
                title="Exportar JSON de todo el lote"
              >
                JSON
              </button>
              <button
                onClick={() => exportToTxt(batchFiles, 'lote_forense.txt')}
                className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
                title="Exportar TXT pericial"
              >
                TXT
              </button>
              <button
                onClick={() => exportToPdf(batchFiles, 'lote_forense.pdf')}
                className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
                title="Exportar informe PDF"
              >
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing Progress Bar */}
      {isProcessingBatch && (
        <div className="p-4 rounded-xl bg-[#0f172a] border border-sky-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sky-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Procesando Lote Forense ({processedCount} de {totalToProcess} analizados)...</span>
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-sky-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">Archivos en el Lote</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1 tabular-nums">
            {batchFiles.length}
          </div>
        </div>
        <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">Duplicados Identificados</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {duplicatesTotal}
          </div>
        </div>
        <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">Discrepancias / Sospechosos</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {discrepanciesTotal}
          </div>
        </div>
        <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">Archivos Consistentes</div>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
            {batchFiles.length - discrepanciesTotal}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {batchFiles.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, extensión, firma o hash SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#091122] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filterType === 'all'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({batchFiles.length})
            </button>
            <button
              onClick={() => setFilterType('duplicates')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filterType === 'duplicates'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Duplicados ({duplicatesTotal})
            </button>
            <button
              onClick={() => setFilterType('discrepancies')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filterType === 'discrepancies'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Discrepancias ({discrepanciesTotal})
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {batchFiles.length === 0 && !isProcessingBatch && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-[#0c1426] rounded-xl p-12 text-center cursor-pointer transition-all group"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-base font-semibold text-slate-100 group-hover:text-purple-300">
            Arrastre múltiples archivos o seleccione una carpeta
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            El sistema procesará la lista de forma no bloqueante, extrayendo hashes y comparando duplicados automáticamente.
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-purple-600/20">
            <span>Seleccionar Lote</span>
          </div>
        </div>
      )}

      {/* Batch Data Table */}
      {filteredFiles.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0f172a] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#091122] text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Nombre de Archivo</th>
                  <th className="px-4 py-3">Extensión</th>
                  <th className="px-4 py-3 text-right">Tamaño</th>
                  <th className="px-4 py-3">Firma Real</th>
                  <th className="px-4 py-3 font-mono">Hash SHA-256</th>
                  <th className="px-4 py-3 text-center">Estado Forense</th>
                  <th className="px-4 py-3 text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredFiles.map((f, idx) => {
                  const isDuplicate = hashCounts[f.sha256] > 1;
                  const hasDiscrepancy = f.discrepancy?.hasDiscrepancy;

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isDuplicate ? 'bg-emerald-950/10' : hasDiscrepancy ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-200 max-w-xs truncate" title={f.name}>
                        {f.name}
                      </td>
                      <td className="px-4 py-3 text-sky-400 font-semibold">{f.extension}</td>
                      <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                        {f.readableSize}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-sans max-w-xs truncate">
                        {f.signature?.name || 'Desconocido'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 truncate max-w-[140px]" title={f.sha256}>
                            {f.sha256?.substring(0, 16)}...
                          </span>
                          <button
                            onClick={() => copyHash(f.sha256, f.id)}
                            className="p-1 hover:text-sky-300 text-slate-400 rounded"
                            title="Copiar SHA-256 completo"
                          >
                            {copiedHash === f.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>DUPLICADO ({hashCounts[f.sha256]})</span>
                          </span>
                        ) : hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>DISCREPANCIA</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            <span>ÚNICO</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onViewFileDetail(f)}
                          className="px-2.5 py-1 text-xs text-sky-300 hover:text-white bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 rounded flex items-center gap-1 mx-auto transition-colors font-sans"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
