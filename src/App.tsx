import React, { useState, useRef, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import SingleAnalyzer from './components/SingleAnalyzer.jsx';
import FileComparator from './components/FileComparator.jsx';
import BatchAnalyzer from './components/BatchAnalyzer.jsx';
import SessionHistory from './components/SessionHistory.jsx';
import ReportsHub from './components/ReportsHub.jsx';
import { analyzeFile } from './utils/forensics.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionFiles, setSessionFiles] = useState<any[]>([]);
  const [currentSingleFile, setCurrentSingleFile] = useState<any>(null);
  const [isAnalyzingSingle, setIsAnalyzingSingle] = useState(false);
  const [singleProgressMsg, setSingleProgressMsg] = useState('');

  // Batch state
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const cancelBatchRef = useRef(false);

  // Calcular métricas globales de duplicados y discrepancias
  const hashCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of sessionFiles) {
      if (f.sha256) {
        counts[f.sha256] = (counts[f.sha256] || 0) + 1;
      }
    }
    return counts;
  }, [sessionFiles]);

  const duplicateCount = useMemo(() => {
    return sessionFiles.filter((f: any) => (hashCounts[f.sha256] || 0) > 1).length;
  }, [sessionFiles, hashCounts]);

  const discrepancyCount = useMemo(() => {
    return sessionFiles.filter((f: any) => f.discrepancy?.hasDiscrepancy).length;
  }, [sessionFiles]);

  // Manejador para análisis de archivo individual
  const handleAnalyzeSingleFile = async (file: any) => {
    if (!file) return;
    setIsAnalyzingSingle(true);
    setSingleProgressMsg('Iniciando lectura de evidencia...');

    try {
      const result = await analyzeFile(file, (msg: string) => setSingleProgressMsg(msg));
      setCurrentSingleFile(result);

      // Agregar a historial de sesión si no existe
      setSessionFiles((prev: any[]) => {
        const filtered = prev.filter((item: any) => item.id !== (result as any).id);
        return [result, ...filtered];
      });
      setActiveTab('single');
    } catch (err: any) {
      console.error('Error analizando archivo individual:', err);
      alert(`Error durante el análisis forense: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsAnalyzingSingle(false);
      setSingleProgressMsg('');
    }
  };

  // Manejador para procesamiento por lotes (secuencial no bloqueante)
  const handleAnalyzeBatch = async (filesList: any[]) => {
    if (!filesList || filesList.length === 0) return;

    // Si es solo 1 archivo y estamos en dashboard, podemos enviarlo al individual
    if (filesList.length === 1 && activeTab === 'dashboard') {
      handleAnalyzeSingleFile(filesList[0]);
      return;
    }

    setIsProcessingBatch(true);
    cancelBatchRef.current = false;
    setBatchProgress({ current: 0, total: filesList.length });
    setActiveTab('batch');

    const newAnalyses: any[] = [];

    for (let i = 0; i < filesList.length; i++) {
      if (cancelBatchRef.current) {
        break;
      }

      const file = filesList[i];
      try {
        const result = await analyzeFile(file);
        newAnalyses.push(result);

        // Actualizar progresivamente el estado
        setSessionFiles((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== (result as any).id);
          return [result, ...filtered];
        });
      } catch (err) {
        console.warn(`Error analizando archivo en lote ${file.name}:`, err);
      }

      setBatchProgress({ current: i + 1, total: filesList.length });

      // Ceder brevemente el control al navegador para evitar congelar la interfaz
      await new Promise((r) => setTimeout(r, 10));
    }

    setIsProcessingBatch(false);
  };

  const handleCancelBatch = () => {
    cancelBatchRef.current = true;
    setIsProcessingBatch(false);
  };

  const handleViewFileDetail = (fileRecord: any) => {
    setCurrentSingleFile(fileRecord);
    setActiveTab('single');
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Desea limpiar todo el historial de la sesión activa?')) {
      setSessionFiles([]);
      setCurrentSingleFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessionFilesCount={sessionFiles.length}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onSelectFiles={handleAnalyzeBatch}
            setActiveTab={setActiveTab}
            sessionFiles={sessionFiles}
            duplicateCount={duplicateCount}
            discrepancyCount={discrepancyCount}
          />
        )}

        {activeTab === 'single' && (
          <SingleAnalyzer
            currentFile={currentSingleFile}
            onFileSelect={handleAnalyzeSingleFile}
            isAnalyzing={isAnalyzingSingle}
            progressMessage={singleProgressMsg}
          />
        )}

        {activeTab === 'comparator' && (
          <FileComparator
            sessionFiles={sessionFiles}
            onAnalyzeFiles={handleAnalyzeBatch}
          />
        )}

        {activeTab === 'batch' && (
          <BatchAnalyzer
            batchFiles={sessionFiles}
            isProcessingBatch={isProcessingBatch}
            processedCount={batchProgress.current}
            totalToProcess={batchProgress.total}
            onUploadBatch={handleAnalyzeBatch}
            onCancelBatch={handleCancelBatch}
            onViewFileDetail={handleViewFileDetail}
          />
        )}

        {activeTab === 'history' && (
          <SessionHistory
            sessionFiles={sessionFiles}
            onClearHistory={handleClearHistory}
            onSelectForSingle={handleViewFileDetail}
            onOpenComparator={() => setActiveTab('comparator')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsHub sessionFiles={sessionFiles} />
        )}
      </main>

      {/* Subtle Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a14] py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Analizador Forense de Archivos</span>
            <span>·</span>
            <span>Motor local de metadatos e integridad criptográfica</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Sin conexión a servidores · Web Crypto SHA-256 · ExifReader · JSZip
          </div>
        </div>
      </footer>
    </div>
  );
}
