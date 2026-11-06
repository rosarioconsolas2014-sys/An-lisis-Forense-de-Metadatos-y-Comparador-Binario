import React, { useState, useRef, useEffect } from 'react';
import {
  FileSearch,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  FileCode,
  HardDrive,
  Camera,
  Music,
  Video,
  FileText,
  MapPin,
  ExternalLink,
  Download,
  FolderArchive,
  RefreshCw,
  Eye,
} from 'lucide-react';
import HexViewer from './HexViewer.jsx';
import { exportToJson, exportToTxt, exportToPdf, exportToCsv } from '../utils/reportGenerator.js';

export default function SingleAnalyzer({ currentFile, onFileSelect, isAnalyzing, progressMessage }) {
  const fileInputRef = useRef(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'metadata' | 'hex' | 'preview'
  const [previewUrl, setPreviewUrl] = useState(null);

  // Generar preview URL para imagen, audio o video
  useEffect(() => {
    if (currentFile?.fileRef) {
      const url = URL.createObjectURL(currentFile.fileRef);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFile]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  // Sin archivo seleccionado
  if (!currentFile && !isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-sky-400" />
              <span>Módulo de Análisis Individual</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Seleccione cualquier archivo para extraer propiedades profundas, firmas binarias y hash SHA-256.
            </p>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-sky-500/30 hover:border-sky-400 bg-sky-950/20 hover:bg-sky-950/30 rounded-xl p-12 text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="w-16 h-16 mx-auto rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-base font-semibold text-slate-100 group-hover:text-sky-300">
            Cargar archivo para análisis forense exhaustivo
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            JPG, PNG, PDF, DOCX, XLSX, MP3, MP4, ZIP, EXE o cualquier archivo binario.
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors">
            <span>Examinar Archivo</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado analizando
  if (isAnalyzing) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
        <RefreshCw className="w-10 h-10 text-sky-400 animate-spin mx-auto" />
        <div className="text-base font-bold text-white">Analizando estructura forense...</div>
        <div className="text-xs text-slate-400 font-mono">{progressMessage || 'Procesando bytes...'}</div>
      </div>
    );
  }

  const f = currentFile;
  const isImage = f.category === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(f.extension.replace('.', ''));
  const isAudio = f.category === 'audio' || ['mp3', 'wav', 'ogg', 'flac'].includes(f.extension.replace('.', ''));
  const isVideo = f.category === 'video' || ['mp4', 'webm', 'mov'].includes(f.extension.replace('.', ''));
  const isPdf = f.extension === '.pdf' || f.metadata?.pdf?.available;
  const isOffice = f.metadata?.office?.available;
  const isArchive = f.metadata?.archive?.available;
  const hasExif = f.metadata?.exif?.available;

  return (
    <div className="space-y-6 pb-12">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white break-all">{f.name}</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {f.extension}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{f.readableSize}</span>
            <span>·</span>
            <span className="font-mono text-slate-300">{f.sizeBytes.toLocaleString('es-ES')} bytes</span>
            <span>·</span>
            <span>{f.signature?.name || 'Formato detectado'}</span>
          </div>
        </div>

        {/* Change file & Export controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Cambiar Archivo</span>
          </button>

          {/* Export dropdown / buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>Exportar:</span>
            </span>
            <button
              onClick={() => exportToTxt(f, `${f.name}_forense.txt`)}
              className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
              title="Exportar informe pericial en formato TXT"
            >
              TXT
            </button>
            <button
              onClick={() => exportToCsv([f], `${f.name}_resumen.csv`)}
              className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
              title="Exportar tabla CSV"
            >
              CSV
            </button>
            <button
              onClick={() => exportToJson(f, `${f.name}_forense.json`)}
              className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
              title="Exportar volcado estructurado JSON"
            >
              JSON
            </button>
            <button
              onClick={() => exportToPdf(f, `${f.name}_forense.pdf`)}
              className="px-2 py-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded font-mono text-[11px]"
              title="Exportar informe formal en PDF"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Sensitive Data Alert (GPS / Privacy) */}
      {f.hasSensitiveData && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>ALERTA DE PRIVACIDAD: Datos de Geolocalización Detectados</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Este archivo contiene coordenadas GPS reales registradas al momento de su creación.
            Cualquier persona que acceda al archivo sin sanitizar puede rastrear la ubicación física exacta del dispositivo.
          </p>
          {f.metadata?.exif?.gps && (
            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-amber-100">
                Latitud: {f.metadata.exif.gps.latitude.toFixed(6)} | Longitud: {f.metadata.exif.gps.longitude.toFixed(6)}
              </span>
              <a
                href={f.metadata.exif.gps.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:underline"
              >
                <span>Ver en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={f.metadata.exif.gps.osmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
              >
                <span>Ver en OpenStreetMap</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Discrepancy Warnings */}
      {f.discrepancy?.hasDiscrepancy && (
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            f.discrepancy.severity === 'critical'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {f.discrepancy.severity === 'critical'
                ? 'ALERTA FORENSE CRÍTICA: Discrepancia Grave de Integridad'
                : 'Advertencia Forense: Discrepancia entre Extensión y Firma Binaria'}
            </span>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside">
            {f.discrepancy.discrepancies.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Propiedades e Integridad
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'metadata'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Metadatos Avanzados
        </button>
        <button
          onClick={() => setActiveTab('hex')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'hex'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Volcado Hexadecimal
        </button>
        {(isImage || isAudio || isVideo || isArchive) && (
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista Previa
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & INTEGRITY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* SHA-256 Card */}
          <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Hash Criptográfico SHA-256 (Identidad Única de Contenido)
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(f.sha256)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors"
                title="Copiar hash SHA-256 completo"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-[#091122] rounded-lg border border-slate-800/80 font-mono text-xs sm:text-sm text-sky-300 break-all select-all tabular-nums">
              {f.sha256}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Cálculo local mediante Web Crypto API (SubtleCrypto)</span>
              <span>Tiempo de análisis: {f.durationMs} ms</span>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* General Info Card */}
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-200">Información General del Archivo</h3>
              </div>
              <dl className="text-xs divide-y divide-slate-800/60">
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Nombre Completo:</dt>
                  <dd className="font-mono text-slate-200 break-all text-right">{f.name}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Extensión:</dt>
                  <dd className="font-mono text-sky-400 font-semibold">{f.extension}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Tamaño Exacto:</dt>
                  <dd className="font-mono text-slate-200 tabular-nums">{f.sizeBytes.toLocaleString('es-ES')} bytes</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Tamaño Legible:</dt>
                  <dd className="font-mono text-emerald-400 font-semibold">{f.readableSize}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Tipo MIME Reportado:</dt>
                  <dd className="font-mono text-slate-300 break-all text-right">{f.mimeType}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Última Modificación (SO):</dt>
                  <dd className="font-mono text-slate-300 text-right">{f.lastModified}</dd>
                </div>
              </dl>
            </div>

            {/* Technical Identification Card */}
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Identificación Técnica & Firmas</h3>
              </div>
              <dl className="text-xs divide-y divide-slate-800/60">
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Tipo Real Detectado:</dt>
                  <dd className="font-mono text-emerald-300 font-semibold text-right">{f.signature?.name || 'Desconocido'}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Firma Mágica (Magic Bytes):</dt>
                  <dd className="font-mono text-sky-400 font-semibold text-right">{f.signature?.signatureHex || 'N/A'}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Descripción de Formato:</dt>
                  <dd className="text-slate-300 text-right">{f.signature?.description || 'Formato genérico'}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Consistencia Forense:</dt>
                  <dd className="text-right">
                    {f.discrepancy?.hasDiscrepancy ? (
                      <span className="font-semibold text-amber-400 flex items-center gap-1 justify-end">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Discrepancia detectada</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                        <Check className="w-3.5 h-3.5" />
                        <span>Consistente (Firma = Extensión)</span>
                      </span>
                    )}
                  </dd>
                </div>
                {f.metadata?.perceptualHash && (
                  <div className="py-2 flex justify-between gap-4">
                    <dt className="text-slate-400">Hash Perceptual (dHash):</dt>
                    <dd className="font-mono text-purple-300 font-semibold">{f.metadata.perceptualHash}</dd>
                  </div>
                )}
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-slate-400">Fecha del Análisis:</dt>
                  <dd className="font-mono text-slate-400 text-right">{f.analysisTimestamp}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCED METADATA */}
      {activeTab === 'metadata' && (
        <div className="space-y-6">
          {/* EXIF IMAGES */}
          {hasExif && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-slate-200">Metadatos EXIF / Cámara / IPTC / XMP</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {f.metadata.exif.rawTagsCount} etiquetas extraídas
                </span>
              </div>

              {/* Camera & Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Fabricante de Cámara</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.exif.camera.make}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Modelo de Dispositivo</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.exif.camera.model}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Software de Procesamiento</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.exif.camera.software}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Fecha de Captura Original</div>
                  <div className="font-semibold text-sky-300 mt-0.5 font-mono">{f.metadata.exif.capture.dateTimeOriginal}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Resolución Registrada</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {f.metadata.exif.capture.width} × {f.metadata.exif.capture.height} px
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Exposición / F-Stop / ISO</div>
                  <div className="font-semibold text-slate-200 mt-0.5 font-mono">
                    {f.metadata.exif.camera.exposureTime} · {f.metadata.exif.camera.fNumber} · ISO {f.metadata.exif.camera.iso}
                  </div>
                </div>
              </div>

              {/* All EXIF Tags Table */}
              <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-900/80 text-xs font-semibold text-slate-300 border-b border-slate-800">
                  Todas las Etiquetas Extraídas ({f.metadata.exif.allTags.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs font-mono">
                    <tbody className="divide-y divide-slate-800/40">
                      {f.metadata.exif.allTags.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="px-3 py-1.5 text-sky-400/80 w-24">{t.category}</td>
                          <td className="px-3 py-1.5 text-slate-300 font-semibold w-1/3">{t.name}</td>
                          <td className="px-3 py-1.5 text-slate-200 break-all">{t.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PDF METADATA */}
          {isPdf && f.metadata?.pdf && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-200">Metadatos del Documento PDF</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Título del Documento</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.pdf.title}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Autor</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.pdf.author}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Aplicación Creadora (Creator)</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.pdf.creator}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Productor / Motor de Impresión (Producer)</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.pdf.producer}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Fecha de Creación Interna</div>
                  <div className="font-semibold text-sky-300 font-mono mt-0.5">{f.metadata.pdf.creationDate}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Cantidad de Páginas</div>
                  <div className="font-semibold text-emerald-400 font-mono mt-0.5">{f.metadata.pdf.pageCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* OFFICE METADATA */}
          {isOffice && f.metadata?.office && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Metadatos Office OpenXML ({f.metadata.office.docType})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Autor Original</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.office.core.creator}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Último Modificador</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.office.core.lastModifiedBy}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Aplicación</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.office.app.application}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Fecha Creación Interna</div>
                  <div className="font-semibold text-sky-300 font-mono mt-0.5">{f.metadata.office.core.created}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Fecha Modificación Interna</div>
                  <div className="font-semibold text-sky-300 font-mono mt-0.5">{f.metadata.office.core.modified}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Número de Revisión</div>
                  <div className="font-semibold text-slate-200 font-mono mt-0.5">{f.metadata.office.core.revision}</div>
                </div>
              </div>

              {/* Si tiene hojas de cálculo */}
              {f.metadata.office.sheets?.length > 0 && (
                <div className="p-3 bg-slate-900/80 rounded border border-slate-800 text-xs">
                  <div className="text-slate-400 mb-1">Hojas de Cálculo Detectadas ({f.metadata.office.sheets.length}):</div>
                  <div className="flex flex-wrap gap-2">
                    {f.metadata.office.sheets.map((sheet, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                        {sheet}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUDIO METADATA */}
          {f.metadata?.audio && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Metadatos de Audio (Etiquetas ID3)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Título</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.audio.title || 'No disponible'}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Artista</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.audio.artist || 'No disponible'}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Álbum</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{f.metadata.audio.album || 'No disponible'}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Año</div>
                  <div className="font-semibold text-slate-200 font-mono mt-0.5">{f.metadata.audio.year || 'No disponible'}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Duración</div>
                  <div className="font-semibold text-emerald-400 font-mono mt-0.5">{f.metadata.audio.durationFormatted}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Versión de Etiqueta</div>
                  <div className="font-semibold text-sky-400 font-mono mt-0.5">{f.metadata.audio.version || 'No disponible'}</div>
                </div>
              </div>
            </div>
          )}

          {/* VIDEO METADATA */}
          {f.metadata?.video && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Video className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200">Metadatos de Contenedor de Video</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Resolución de Video</div>
                  <div className="font-semibold text-slate-200 font-mono mt-0.5">{f.metadata.video.resolution}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Duración</div>
                  <div className="font-semibold text-purple-300 font-mono mt-0.5">{f.metadata.video.durationFormatted}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Fecha de Creación Atómica (QuickTime)</div>
                  <div className="font-semibold text-sky-300 font-mono mt-0.5">{f.metadata.video.creationDate || 'No disponible'}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Marca Principal (Major Brand)</div>
                  <div className="font-semibold text-slate-200 font-mono mt-0.5">{f.metadata.video.majorBrand || 'No disponible'}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 col-span-2">
                  <div className="text-slate-400">Códecs Detectados</div>
                  <div className="font-semibold text-slate-200 mt-0.5 font-mono">
                    {f.metadata.video.codecs?.length > 0 ? f.metadata.video.codecs.join(', ') : 'No identificados en átomos estándar'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARCHIVE ZIP METADATA */}
          {isArchive && f.metadata?.archive && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-200">Estructura Interna del Archivo Comprimido</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {f.metadata.archive.fileCount} archivos · {f.metadata.archive.directoryCount} carpetas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Tamaño Descomprimido Total</div>
                  <div className="font-semibold text-emerald-400 font-mono mt-0.5">
                    {f.metadata.archive.readableTotalUncompressed}
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Entradas Totales</div>
                  <div className="font-semibold text-slate-200 font-mono mt-0.5">
                    {f.metadata.archive.totalEntries}
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-slate-400">Comentario del Archivo</div>
                  <div className="font-semibold text-slate-300 mt-0.5 truncate">
                    {f.metadata.archive.archiveComment}
                  </div>
                </div>
              </div>

              {/* Internal Files Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 text-left sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5">Ruta Interna</th>
                      <th className="px-3 py-1.5 text-right">Tamaño</th>
                      <th className="px-3 py-1.5 text-right">Fecha Interna</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {f.metadata.archive.files.map((file, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="px-3 py-1 text-slate-300 truncate max-w-xs">{file.name}</td>
                        <td className="px-3 py-1 text-right text-emerald-400/90">{file.readableSize}</td>
                        <td className="px-3 py-1 text-right text-slate-400">{file.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Si no hay metadatos especiales disponibles */}
          {!hasExif && !isPdf && !isOffice && !f.metadata?.audio && !f.metadata?.video && !isArchive && (
            <div className="p-8 text-center rounded-xl bg-[#0f172a] border border-slate-800 text-slate-400 text-xs">
              Este formato no cuenta con contenedores de metadatos estandarizados (como EXIF, ID3 u Office OpenXML).
              Consulte la pestaña "Volcado Hexadecimal" para inspeccionar la estructura binaria directa.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HEX VIEWER */}
      {activeTab === 'hex' && (
        <div className="space-y-4">
          <HexViewer hexRows={f.hexDump} />
        </div>
      )}

      {/* TAB 4: PREVIEW */}
      {activeTab === 'preview' && (
        <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Eye className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-200">Vista Previa Local Segura</h3>
          </div>

          {isImage && previewUrl && (
            <div className="text-center space-y-2">
              <div className="max-h-96 inline-block overflow-hidden rounded-lg border border-slate-800 bg-[#091122]">
                <img
                  src={previewUrl}
                  alt={f.name}
                  className="max-h-96 max-w-full object-contain mx-auto"
                />
              </div>
              <div className="text-xs text-slate-400">
                Renderizado directo en memoria mediante URL de objeto Blob local.
              </div>
            </div>
          )}

          {isAudio && previewUrl && (
            <div className="p-6 text-center space-y-4 bg-[#091122] rounded-lg border border-slate-800">
              <Music className="w-12 h-12 text-emerald-400 mx-auto" />
              <audio controls className="w-full max-w-md mx-auto" src={previewUrl}>
                Tu navegador no soporta el elemento audio.
              </audio>
              <div className="text-xs text-slate-400">Reproducción local aislada sin streaming remoto.</div>
            </div>
          )}

          {isVideo && previewUrl && (
            <div className="text-center space-y-2">
              <video
                controls
                className="max-h-96 max-w-full rounded-lg mx-auto border border-slate-800 bg-black"
                src={previewUrl}
              >
                Tu navegador no soporta el elemento video.
              </video>
              <div className="text-xs text-slate-400">
                Resolución: {f.metadata?.video?.resolution || 'N/D'} · Duración: {f.metadata?.video?.durationFormatted || 'N/D'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
