import React from 'react';
import { ShieldCheck, FileSearch, GitCompare, Files, History, FileText, LayoutDashboard } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, sessionFilesCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'single', label: 'Análisis Individual', icon: FileSearch },
    { id: 'comparator', label: 'Comparador', icon: GitCompare },
    { id: 'batch', label: 'Lotes', icon: Files },
    { id: 'history', label: `Historial (${sessionFilesCount})`, icon: History },
    { id: 'reports', label: 'Informes', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070d19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
            <FileSearch className="w-5 h-5" />
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <div className="text-base font-bold tracking-tight text-slate-100 group-hover:text-sky-400 transition-colors whitespace-nowrap">
              ANALIZADOR FORENSE
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase -mt-0.5">
              METADATOS & IDENTIFICACIÓN DIGITAL
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Security & Privacy guarantee */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline font-mono text-[11px] font-medium">100% Local · Sandbox Privado</span>
            <span className="sm:hidden font-mono text-[11px]">Local</span>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-[#091122] border-t border-slate-800/80 gap-1 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
