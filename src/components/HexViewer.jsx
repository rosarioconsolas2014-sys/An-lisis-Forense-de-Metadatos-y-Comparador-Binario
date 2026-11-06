import React, { useState } from 'react';
import { Eye, Copy, Check } from 'lucide-react';

export default function HexViewer({ hexRows = [] }) {
  const [copied, setCopied] = useState(false);

  const copyHexText = () => {
    const text = hexRows
      .map((r) => `${r.offset}  ${r.hex1}  ${r.hex2}  |${r.ascii}|`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hexRows || hexRows.length === 0) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">
        No hay datos hexadecimales disponibles para visualización.
      </div>
    );
  }

  return (
    <div className="border border-slate-800 bg-[#091122] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-300">Encabezado Binario (Hex Dump)</span>
          <span className="text-slate-500">·</span>
          <span>{hexRows.length * 16} bytes analizados</span>
        </div>
        <button
          onClick={copyHexText}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors"
          title="Copiar volcado hexadecimal completo al portapapeles"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copiar Hex</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3 overflow-x-auto max-h-72">
        <table className="w-full text-xs font-mono tabular-nums leading-relaxed select-text">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800/80 pb-1 text-left">
              <th className="pr-4 font-medium text-sky-400/80">OFFSET</th>
              <th className="pr-3 font-medium">00 01 02 03 04 05 06 07</th>
              <th className="pr-4 font-medium">08 09 0A 0B 0C 0D 0E 0F</th>
              <th className="font-medium text-slate-400">ASCII</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {hexRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-sky-950/20 transition-colors">
                <td className="pr-4 text-sky-400/90 font-semibold py-0.5">{row.offset}</td>
                <td className="pr-3 text-slate-200 py-0.5 tracking-wider">{row.hex1}</td>
                <td className="pr-4 text-slate-200 py-0.5 tracking-wider">{row.hex2}</td>
                <td className="text-emerald-400/90 py-0.5 whitespace-pre font-mono bg-slate-950/40 px-2 rounded">
                  {row.ascii}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Primeros bytes determinantes para la firma mágica (Magic Numbers)</span>
        <span className="font-mono text-sky-400">16 bytes / fila</span>
      </div>
    </div>
  );
}
