import React, { useState } from 'react';
import { History, Trash2, Search, Eye, GitCompare, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { exportToCsv, exportToJson } from '../utils/reportGenerator.js';

/**
 * @param {object} props
 * @param {any[]} [props.sessionFiles]
 * @param {any} [props.onClearHistory]
 * @param {any} [props.onSelectForSingle]
 * @param {any} [props.onOpenComparator]
 */
export default function SessionHistory({
  sessionFiles = [],
  onClearHistory,
  onSelectForSingle,
  onOpenComparator,
}) {
  const [search, setSearch] = useState('');

  const filtered = sessionFiles.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.extension.toLowerCase().includes(q) ||
      f.sha256?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>Historial de Análisis de la Sesión</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro de todas las evidencias procesadas en memoria durante la sesión activa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sessionFiles.length > 0 && (
            <>
              <button
                onClick={() => exportToCsv(sessionFiles, 'historial_forense.csv')}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 rounded-lg border border-rose-800/60 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Historial</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {sessionFiles.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar en el historial por nombre o hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#091122] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>
      )}

      {/* Empty State */}
      {sessionFiles.length === 0 && (
        <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
          <History className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="text-base font-bold text-slate-300">Historial de sesión vacío</div>
          <div className="text-xs text-slate-400 max-w-sm mx-auto">
            Los archivos que analices en el módulo individual, comparador o análisis por lotes aparecerán aquí automáticamente.
          </div>
        </div>
      )}

      {/* History List */}
      {filtered.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0f172a]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#091122] text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-4 py-3">Evidencia</th>
                  <th className="px-4 py-3">Tamaño</th>
                  <th className="px-4 py-3">Firma</th>
                  <th className="px-4 py-3">Hash SHA-256</th>
                  <th className="px-4 py-3">Hora de Análisis</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3 font-sans font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{f.name}</span>
                        {f.discrepancy?.hasDiscrepancy && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Discrepancia detectada" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">{f.readableSize}</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">{f.signature?.name}</td>
                    <td className="px-4 py-3 text-sky-400/90 truncate max-w-[150px]" title={f.sha256}>
                      {f.sha256?.substring(0, 16)}...
                    </td>
                    <td className="px-4 py-3 text-slate-400">{f.analysisTimestamp}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 font-sans">
                        <button
                          onClick={() => onSelectForSingle(f)}
                          className="px-2 py-1 text-xs text-sky-300 hover:text-white bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 rounded flex items-center gap-1 transition-colors"
                          title="Inspeccionar en detalle"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspeccionar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
