import React, { useRef } from 'react';
import {
  FileSearch,
  GitCompare,
  Files,
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  FileCheck,
  AlertTriangle,
  Upload,
  ArrowRight,
} from 'lucide-react';

/**
 * @param {object} props
 * @param {any} [props.onSelectFiles]
 * @param {any} [props.setActiveTab]
 * @param {any[]} [props.sessionFiles]
 * @param {number} [props.duplicateCount]
 * @param {number} [props.discrepancyCount]
 */
export default function Dashboard({
  onSelectFiles,
  setActiveTab,
  sessionFiles = [],
  duplicateCount = 0,
  discrepancyCount = 0,
}) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSelectFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelectFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0f1d38] via-[#0d172e] to-[#0a1122] border border-sky-900/30 p-6 sm:p-10 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>ENTORNO FORENSE LOCAL DE ALTA PRECISIÓN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Análisis Forense de Metadatos y Comparador Binario
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Inspección profunda de archivos digitales, extracción de metadatos ocultos (EXIF, GPS, IPTC, XMP, PDF, Office, ID3),
            cálculo criptográfico de SHA-256 y detección de discrepancias binarias sin enviar datos a la red.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-[#091122]/80 border border-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-400 font-medium">Archivos en Sesión</div>
              <div className="text-xl font-bold font-mono text-sky-400 tabular-nums">
                {sessionFiles.length}
              </div>
            </div>
            <div className="bg-[#091122]/80 border border-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-400 font-medium">Duplicados Exactos</div>
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {duplicateCount}
              </div>
            </div>
            <div className="bg-[#091122]/80 border border-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-400 font-medium">Discrepancias / Alertas</div>
              <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {discrepancyCount}
              </div>
            </div>
            <div className="bg-[#091122]/80 border border-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-400 font-medium">Privacidad de Datos</div>
              <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Local</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drag & Drop Hero Box */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="mt-8 border-2 border-dashed border-sky-500/30 hover:border-sky-400 bg-sky-950/20 hover:bg-sky-950/30 rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-14 h-14 mx-auto rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-base font-semibold text-slate-100 group-hover:text-sky-300">
            Arrastre uno o varios archivos aquí para iniciar el análisis
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Soporta cualquier formato (Imágenes, PDF, Word, Excel, Audio, Video, ZIP, Binarios). El procesamiento se realiza de inmediato en el navegador.
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20">
            <span>Seleccionar Archivos desde el Dispositivo</span>
          </div>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1: Single */}
        <div
          onClick={() => setActiveTab('single')}
          className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all group hover:bg-[#121c33] shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileSearch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
              Análisis Individual Profundo
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Examen minucioso de un archivo único: firma mágica, encabezado hexadecimal, cálculo SHA-256, metadatos EXIF/GPS, propiedades Office y visor en vivo.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <span>Iniciar análisis individual</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 2: Comparator */}
        <div
          onClick={() => setActiveTab('comparator')}
          className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all group hover:bg-[#121c33] shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
              Comparador Forense Múltiple
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comparación binaria de SHA-256, localización del primer byte diferente (offset hex), matriz de diferencias de metadatos y similitud perceptual visual (pHash).
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span>Abrir comparador</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Module 3: Batch */}
        <div
          onClick={() => setActiveTab('batch')}
          className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all group hover:bg-[#121c33] shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Files className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
              Análisis Forense por Lotes
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Carga y procesamiento masivo de decenas o cientos de archivos. Agrupación automática de duplicados por hash SHA-256 y detección de extensiones disfrazadas.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-400">
            <span>Procesar lote</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Forensic Pillars & Guarantees */}
      <div className="p-6 rounded-xl bg-[#0c1426] border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Principios y Capacidades del Sistema
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
            <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Firmas Binarias Reales</div>
              <div className="text-slate-400 mt-0.5">
                Identificación por Magic Numbers en lugar de confiar ciegamente en la extensión del archivo.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Integridad SHA-256</div>
              <div className="text-slate-400 mt-0.5">
                Cálculo estándar criptográfico mediante Web Crypto API para verificar identidad de contenido.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Alertas de Discrepancia</div>
              <div className="text-slate-400 mt-0.5">
                Detección de técnicas de camuflaje (ej: ejecutable PE camuflado con extensión .jpg).
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Privacidad Estricta</div>
              <div className="text-slate-400 mt-0.5">
                Ningún byte abandona el dispositivo del usuario. Todo corre en la memoria local del navegador.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
