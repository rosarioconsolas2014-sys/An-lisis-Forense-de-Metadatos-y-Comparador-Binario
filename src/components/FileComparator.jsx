import React, { useState, useEffect, useRef } from 'react';
import {
  GitCompare,
  Upload,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  FileX,
  Eye,
  Download,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';
import { computeBinaryByteDiff, compareFileMetadata, compareVisualImages } from '../utils/comparator.js';
import { exportToTxt, exportToJson } from '../utils/reportGenerator.js';

/**
 * @param {object} props
 * @param {any[]} [props.sessionFiles]
 * @param {any} [props.onAnalyzeFiles]
 */
export default function FileComparator({ sessionFiles = [], onAnalyzeFiles }) {
  const [selectedFileAId, setSelectedFileAId] = useState('');
  const [selectedFileBId, setSelectedFileBId] = useState('');
  const [comparisonMode, setComparisonMode] = useState('binary'); // 'binary' | 'metadata' | 'visual'
  const [binaryDiff, setBinaryDiff] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-seleccionar los dos primeros archivos si hay al menos 2
  useEffect(() => {
    if (sessionFiles.length >= 2) {
      if (!selectedFileAId) setSelectedFileAId(sessionFiles[0].id);
      if (!selectedFileBId) setSelectedFileBId(sessionFiles[1].id);
    } else if (sessionFiles.length === 1) {
      if (!selectedFileAId) setSelectedFileAId(sessionFiles[0].id);
    }
  }, [sessionFiles]);

  const fileA = sessionFiles.find((f) => f.id === selectedFileAId);
  const fileB = sessionFiles.find((f) => f.id === selectedFileBId);

  // Ejecutar comparación binaria byte-a-byte cuando cambian los archivos seleccionados
  useEffect(() => {
    async function runDiff() {
      if (fileA?.fileRef && fileB?.fileRef) {
        setIsComparing(true);
        try {
          const bufferA = await fileA.fileRef.arrayBuffer();
          const bufferB = await fileB.fileRef.arrayBuffer();
          const diffResult = computeBinaryByteDiff(bufferA, bufferB);
          setBinaryDiff(diffResult);
        } catch (err) {
          console.error('Error calculando diff binario:', err);
          setBinaryDiff(null);
        } finally {
          setIsComparing(false);
        }
      } else {
        setBinaryDiff(null);
      }
    }
    runDiff();
  }, [fileA, fileB]);

  const handleUploadFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onAnalyzeFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAnalyzeFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Comparación de metadatos
  const metadataMatrix = fileA && fileB ? compareFileMetadata(fileA, fileB) : [];
  const matchesCount = metadataMatrix.filter((m) => m.matches).length;
  const differencesCount = metadataMatrix.filter((m) => !m.matches).length;

  // Comparación visual perceptual (para imágenes)
  const visualComparison = fileA && fileB ? compareVisualImages(fileA, fileB) : null;
  const bothAreImages = fileA && fileB && visualComparison !== null;

  const exportComparison = (format) => {
    if (!fileA || !fileB) return;
    const reportData = {
      comparisonType: 'Comparación Forense Bipersonal',
      fileA: { name: fileA.name, sha256: fileA.sha256, sizeBytes: fileA.sizeBytes },
      fileB: { name: fileB.name, sha256: fileB.sha256, sizeBytes: fileB.sizeBytes },
      binaryResult: binaryDiff
        ? {
            areIdentical: binaryDiff.identical,
            firstDiffOffset: binaryDiff.firstDiffOffsetHex,
            differingBytes: binaryDiff.totalDifferingBytes,
            matchPercentage: binaryDiff.matchPercentage,
          }
        : null,
      metadataComparison: metadataMatrix,
      visualComparison,
    };

    if (format === 'json') {
      exportToJson(reportData, `comparacion_${fileA.name}_vs_${fileB.name}.json`);
    } else {
      exportToTxt([fileA, fileB], `comparacion_${fileA.name}_vs_${fileB.name}.txt`, {
        caseNumber: 'COMP-FORENSE',
        notes: `Resultado Binario: ${binaryDiff?.identical ? 'IDENTICOS' : 'DIFERENTES'} | Coincidencias de Metadatos: ${matchesCount} | Diferencias: ${differencesCount}`,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <span>Módulo de Comparación Forense Múltiple</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Distingue rigurosamente entre identidad binaria (bit-a-bit) y similitud de metadatos o apariencia visual.
          </p>
        </div>

        {/* Upload more files */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUploadFiles}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar Archivos para Comparar</span>
          </button>

          {fileA && fileB && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>Exportar:</span>
              </span>
              <button
                onClick={() => exportComparison('txt')}
                className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
              >
                TXT
              </button>
              <button
                onClick={() => exportComparison('json')}
                className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
              >
                JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selector Cards (File A vs File B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector File A */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
              Archivo Primario (A)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {fileA ? fileA.readableSize : 'Sin seleccionar'}
            </span>
          </div>

          {sessionFiles.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border border-dashed border-slate-700 hover:border-sky-500 rounded-lg text-center cursor-pointer transition-colors"
            >
              <div className="text-xs text-slate-400">Arrastre archivos o haga clic para cargarlos</div>
            </div>
          ) : (
            <select
              value={selectedFileAId}
              onChange={(e) => setSelectedFileAId(e.target.value)}
              className="w-full bg-[#091122] border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
            >
              {sessionFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.readableSize}) · {f.signature?.name || 'Formato'}
                </option>
              ))}
            </select>
          )}

          {fileA && (
            <div className="pt-2 text-[11px] space-y-1 font-mono text-slate-300">
              <div className="truncate">
                <span className="text-slate-400">SHA-256: </span>
                <span className="text-sky-300">{fileA.sha256}</span>
              </div>
              <div>
                <span className="text-slate-400">Tamaño: </span>
                <span>{fileA.sizeBytes.toLocaleString('es-ES')} bytes</span>
              </div>
            </div>
          )}
        </div>

        {/* Selector File B */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Archivo Comparativo (B)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {fileB ? fileB.readableSize : 'Sin seleccionar'}
            </span>
          </div>

          {sessionFiles.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg text-center cursor-pointer transition-colors"
            >
              <div className="text-xs text-slate-400">Arrastre archivos o haga clic para cargarlos</div>
            </div>
          ) : (
            <select
              value={selectedFileBId}
              onChange={(e) => setSelectedFileBId(e.target.value)}
              className="w-full bg-[#091122] border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
            >
              {sessionFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.readableSize}) · {f.signature?.name || 'Formato'}
                </option>
              ))}
            </select>
          )}

          {fileB && (
            <div className="pt-2 text-[11px] space-y-1 font-mono text-slate-300">
              <div className="truncate">
                <span className="text-slate-400">SHA-256: </span>
                <span className="text-emerald-300">{fileB.sha256}</span>
              </div>
              <div>
                <span className="text-slate-400">Tamaño: </span>
                <span>{fileB.sizeBytes.toLocaleString('es-ES')} bytes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORENSIC VERDICT BANNER */}
      {fileA && fileB && binaryDiff && (
        <div
          className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            binaryDiff.identical
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {binaryDiff.identical ? (
              <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="text-base font-bold flex items-center gap-2">
                <span>
                  {binaryDiff.identical
                    ? 'DICTAMEN: ARCHIVOS BINARIAMENTE IDÉNTICOS'
                    : 'DICTAMEN: ARCHIVOS CON CONTENIDO DIFERENTE'}
                </span>
                {binaryDiff.identical && fileA.name !== fileB.name && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Nombres diferentes pero contenido 100% igual
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {binaryDiff.identical
                  ? 'Ambos archivos poseen exactamente el mismo hash SHA-256 y secuencia de bytes. No existe alteración en su contenido binario.'
                  : `El hash SHA-256 difiere. Se detectaron diferencias en los bytes (Coincidencia binaria: ${binaryDiff.matchPercentage}%).`}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <div className="text-slate-400">Coincidencias Metadatos</div>
              <div className="text-emerald-400 font-bold">{matchesCount} campos</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400">Diferencias</div>
              <div className="text-amber-400 font-bold">{differencesCount} campos</div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setComparisonMode('binary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            comparisonMode === 'binary'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>A. Comparación Binaria & Byte Diff</span>
        </button>

        <button
          onClick={() => setComparisonMode('metadata')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            comparisonMode === 'metadata'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>B. Comparación de Metadatos</span>
        </button>

        {bothAreImages && (
          <button
            onClick={() => setComparisonMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              comparisonMode === 'visual'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>C. Comparación Visual Perceptual (pHash)</span>
          </button>
        )}
      </div>

      {/* MODE A: BINARY COMPARISON & BYTE DIFF */}
      {comparisonMode === 'binary' && binaryDiff && (
        <div className="space-y-6">
          {/* Binary Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
              <div className="text-xs text-slate-400">Identidad SHA-256</div>
              <div className="text-sm font-bold font-mono mt-1">
                {fileA.sha256 === fileB.sha256 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> IDÉNTICOS
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> DIFERENTES
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
              <div className="text-xs text-slate-400">Comparación de Tamaño</div>
              <div className="text-sm font-bold font-mono mt-1">
                {binaryDiff.sameSize ? (
                  <span className="text-emerald-400">Igual tamaño exacto</span>
                ) : (
                  <span className="text-amber-400">
                    Difieren en {binaryDiff.sizeDiffBytes.toLocaleString('es-ES')} bytes
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
              <div className="text-xs text-slate-400">Primer Byte Diferente</div>
              <div className="text-sm font-bold font-mono mt-1 text-sky-400">
                {binaryDiff.identical
                  ? 'Sin diferencias'
                  : `${binaryDiff.firstDiffOffsetHex} (${binaryDiff.firstDiffOffset.toLocaleString('es-ES')} bytes)`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
              <div className="text-xs text-slate-400">Bytes Diferentes Totales</div>
              <div className="text-sm font-bold font-mono mt-1 text-purple-400">
                {binaryDiff.totalDifferingBytes.toLocaleString('es-ES')} bytes
              </div>
            </div>
          </div>

          {/* Detailed First Diff Byte Inspector */}
          {!binaryDiff.identical && binaryDiff.byteA && binaryDiff.byteB && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-200">
                    Detalle del Punto de Discrepancia (Offset {binaryDiff.firstDiffOffsetHex})
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Posición absoluta: byte #{binaryDiff.firstDiffOffset}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#091122] rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-400">Byte en Archivo A ({fileA.name}):</div>
                  <div className="text-base font-bold text-sky-400">
                    0x{binaryDiff.byteA.hex} <span className="text-slate-400 font-normal">('{binaryDiff.byteA.char}')</span>
                  </div>
                </div>

                <div className="p-3 bg-[#091122] rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-400">Byte en Archivo B ({fileB.name}):</div>
                  <div className="text-base font-bold text-amber-400">
                    0x{binaryDiff.byteB.hex} <span className="text-slate-400 font-normal">('{binaryDiff.byteB.char}')</span>
                  </div>
                </div>
              </div>

              {/* Side-by-side Hex Diff Window */}
              {binaryDiff.diffWindowA?.length > 0 && (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-300 font-semibold flex items-center justify-between">
                    <span>Ventana de Contexto Hexadecimal alrededor de la primera discrepancia</span>
                    <span className="text-[11px] text-amber-400 font-mono">Resaltado en amarillo = diferencia</span>
                  </div>
                  <div className="p-3 overflow-x-auto max-h-60">
                    <table className="w-full text-xs font-mono tabular-nums leading-relaxed">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800/80 text-left">
                          <th className="pr-4">OFFSET</th>
                          <th className="pr-4 text-sky-400">HEX ARCHIVO A</th>
                          <th className="pr-4 text-sky-400">ASCII A</th>
                          <th className="pr-4 text-emerald-400">HEX ARCHIVO B</th>
                          <th className="text-emerald-400">ASCII B</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {binaryDiff.diffWindowA.map((itemA, i) => {
                          const itemB = binaryDiff.diffWindowB[i];
                          const isDiff = itemA.isDiff;
                          const isFirst = itemA.isFirstDiff;

                          return (
                            <tr
                              key={i}
                              className={
                                isFirst
                                  ? 'bg-amber-500/20'
                                  : isDiff
                                  ? 'bg-amber-950/20'
                                  : 'hover:bg-slate-900/40'
                              }
                            >
                              <td className="pr-4 py-0.5 text-slate-400">
                                0x{itemA.pos.toString(16).padStart(8, '0').toUpperCase()}
                                {isFirst && <span className="ml-1 text-amber-400 font-bold">★ PRIMER DIFF</span>}
                              </td>
                              <td
                                className={`pr-4 py-0.5 font-bold ${
                                  isDiff ? 'text-amber-300' : 'text-slate-200'
                                }`}
                              >
                                {itemA.hex}
                              </td>
                              <td className="pr-4 py-0.5 text-slate-300">{itemA.ascii}</td>
                              <td
                                className={`pr-4 py-0.5 font-bold ${
                                  isDiff ? 'text-amber-300' : 'text-slate-200'
                                }`}
                              >
                                {itemB.hex}
                              </td>
                              <td className="py-0.5 text-slate-300">{itemB.ascii}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE B: METADATA COMPARISON MATRIX */}
      {comparisonMode === 'metadata' && (
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Matriz Comparativa de Metadatos y Propiedades Internas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verde: Valores coincidentes · Amarillo: Propiedades con discrepancias o exclusivas de un archivo
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {matchesCount} Iguales
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {differencesCount} Distintos
              </span>
            </div>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/90 text-slate-400 text-left border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 w-1/4">Campo / Propiedad</th>
                  <th className="px-3 py-2 text-sky-400 w-1/3 truncate">Archivo A: {fileA.name}</th>
                  <th className="px-3 py-2 text-emerald-400 w-1/3 truncate">Archivo B: {fileB.name}</th>
                  <th className="px-3 py-2 text-center w-20">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {metadataMatrix.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.matches ? 'hover:bg-slate-900/50' : 'bg-amber-950/10 hover:bg-amber-950/20'
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-300 font-sans font-medium">{row.field}</td>
                    <td
                      className={`px-3 py-2 break-all ${
                        row.matches ? 'text-slate-300' : 'text-amber-200 font-semibold'
                      }`}
                    >
                      {row.valA}
                    </td>
                    <td
                      className={`px-3 py-2 break-all ${
                        row.matches ? 'text-slate-300' : 'text-amber-200 font-semibold'
                      }`}
                    >
                      {row.valB}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.matches ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Igual</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Difiere</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE C: PERCEPTUAL VISUAL COMPARISON (IMAGES) */}
      {comparisonMode === 'visual' && visualComparison && (
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Comparación Visual Perceptual (dHash - 64 bits)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evalúa si dos imágenes son visualmente la misma fotografía o diseño, ignorando metadatos o compresión.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Similitud Perceptual: </span>
              <span className="text-base font-bold font-mono text-purple-300">
                {visualComparison.similarityPercentage}%
              </span>
            </div>
          </div>

          {/* Visual Similarity Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Distancia de Hamming: {visualComparison.distance} bits de diferencia</span>
              <span>
                {visualComparison.isVisuallyIdentical
                  ? 'Visualmente Idénticas (0 bits diff)'
                  : visualComparison.isHighlySimilar
                  ? 'Altamente Similares'
                  : 'Imágenes Diferentes'}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  visualComparison.similarityPercentage > 90
                    ? 'bg-emerald-500'
                    : visualComparison.similarityPercentage > 75
                    ? 'bg-purple-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${visualComparison.similarityPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Forensic Disclaimer Notice */}
          <div className="p-3 bg-[#091122] rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>{visualComparison.disclaimer}</div>
          </div>

          {/* Side-by-side Image Render */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-[#091122] rounded-lg border border-slate-800 text-center space-y-2">
              <div className="text-xs font-semibold text-sky-400 truncate">{fileA.name}</div>
              {fileA.fileRef && (
                <img
                  src={URL.createObjectURL(fileA.fileRef)}
                  alt={fileA.name}
                  className="max-h-64 mx-auto rounded object-contain border border-slate-800"
                />
              )}
              <div className="text-[11px] font-mono text-slate-400">dHash: {visualComparison.hashA}</div>
            </div>

            <div className="p-3 bg-[#091122] rounded-lg border border-slate-800 text-center space-y-2">
              <div className="text-xs font-semibold text-emerald-400 truncate">{fileB.name}</div>
              {fileB.fileRef && (
                <img
                  src={URL.createObjectURL(fileB.fileRef)}
                  alt={fileB.name}
                  className="max-h-64 mx-auto rounded object-contain border border-slate-800"
                />
              )}
              <div className="text-[11px] font-mono text-slate-400">dHash: {visualComparison.hashB}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
