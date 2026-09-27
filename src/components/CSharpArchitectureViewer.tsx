import React, { useState } from 'react';
import { 
  FileCode2, 
  Folder, 
  FolderOpen, 
  File, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Server, 
  Database, 
  Cpu, 
  Boxes,
  Code2,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { CSHARP_SOLUTION_FILES } from '../data/csharpSolutionTree';
import { CSharpFileDefinition } from '../types';

export const CSharpArchitectureViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CSharpFileDefinition>(
    CSHARP_SOLUTION_FILES.find(f => f.filename === 'MrpStockService.cs') || CSHARP_SOLUTION_FILES[0]
  );
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/Modules': true,
    'src/Modules/Erp': true,
    'src/Modules/Erp/BladyProduction.Erp.Domain': true,
    'src/Modules/Erp/BladyProduction.Erp.Services': true,
    'src/Modules/Mes': true,
    'src/Modules/Mes/BladyProduction.Mes.Services': true,
    'src/Host': true,
    'src/Host/BladyProduction.AppHost': true
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = selectedFile.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Group files by module/category
  const erpFiles = CSHARP_SOLUTION_FILES.filter(f => f.project.includes('Erp'));
  const mesFiles = CSHARP_SOLUTION_FILES.filter(f => f.project.includes('Mes'));
  const connectivityFiles = CSHARP_SOLUTION_FILES.filter(f => f.project.includes('Connectivity'));
  const hostFiles = CSHARP_SOLUTION_FILES.filter(f => f.project.includes('AppHost') || f.project.includes('Solution'));
  const sharedFiles = CSHARP_SOLUTION_FILES.filter(f => f.project.includes('Shared'));

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Architecture Vision */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Architecture Monolithe Modulaire C# (.NET 8/9)
                </h2>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                  Clean Architecture / DDD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Structure de dossiers et code source complet séparant strictement l'ERP, le MES et la Connectivité industrielle.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/monusine-standalone.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              title="Ouvrir la démo HTML5 statique et autonome"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Démo HTML Autonome</span>
            </a>

            <button
              onClick={handleDownloadFile}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger {selectedFile.filename}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Architectural Blocks Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Schéma des Frontières Métier & Communication Inter-Modules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          
          {/* Host */}
          <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
              <Server className="w-4 h-4" />
              <span>BladyProduction.AppHost</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Point d'entrée unique (<code className="text-indigo-300 font-mono">Program.cs</code>). Déploie l'ensemble de la solution localement sur le serveur d'usine sans microservices.
            </p>
          </div>

          {/* ERP Module */}
          <div className="p-3 bg-slate-950 rounded-xl border border-sky-500/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-sky-400 font-bold">
              <Boxes className="w-4 h-4" />
              <span>Module ERP (Liquides)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Articles, Nomenclatures avec pertes tolérables, Stocks, Achats & Moteur MRP (<code className="text-sky-300 font-mono">MrpStockService.cs</code>).
            </p>
          </div>

          {/* MES Module */}
          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>Module MES (Atelier)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ordres de fabrication (OF), Cuves de mélange, Suivi opérateurs, Calcul TRS et généalogie des lots.
            </p>
          </div>

          {/* Connectivity */}
          <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Connectivité Industrielle</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Client OPC UA / Modbus / MQTT. Scrutation continue des automates en tâche de fond (.NET <code className="text-amber-300 font-mono">BackgroundService</code>).
            </p>
          </div>

        </div>

        {/* Central Event Bus note */}
        <div className="mt-3 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Pont In-Memory :</span>
            <span className="text-slate-400">
              Le MES et l'ERP ne partagent pas leurs bases de données. Ils communiquent par événements en mémoire (<code className="text-sky-300 font-mono">ProductionRealiseeIntegrationEvent</code>) pour déclencher la post-déduction.
            </span>
          </div>
          <span className="text-indigo-400 font-mono">Latence &lt; 1ms</span>
        </div>
      </div>

      {/* Code Browser Grid: Solution Explorer Tree (Left) + Code Viewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Solution Explorer Tree */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-sky-400" />
              <span>Explorateur de Solution .NET</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">BladyProduction.sln</span>
          </div>

          <div className="p-3 space-y-3 text-xs max-h-[600px] overflow-y-auto">
            
            {/* Host Files */}
            <div>
              <div className="text-[11px] font-bold text-indigo-400 flex items-center space-x-1 mb-1">
                <Server className="w-3.5 h-3.5" />
                <span>Hôte & Configuration</span>
              </div>
              <div className="pl-4 space-y-1">
                {hostFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                      selectedFile.path === file.path 
                        ? 'bg-indigo-950/60 text-indigo-300 font-semibold border-l-2 border-indigo-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <File className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-mono text-[11px] truncate">{file.filename}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ERP Files */}
            <div>
              <div className="text-[11px] font-bold text-sky-400 flex items-center space-x-1 mb-1">
                <Boxes className="w-3.5 h-3.5" />
                <span>BladyProduction.Erp (Domaine & Services)</span>
              </div>
              <div className="pl-4 space-y-1">
                {erpFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                      selectedFile.path === file.path 
                        ? 'bg-sky-950/60 text-sky-300 font-semibold border-l-2 border-sky-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                    <span className="font-mono text-[11px] truncate">{file.filename}</span>
                    {file.filename === 'MrpStockService.cs' && (
                      <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-bold ml-auto">
                        PDF
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* MES Files */}
            <div>
              <div className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>BladyProduction.Mes (Domaine & Calcul TRS)</span>
              </div>
              <div className="pl-4 space-y-1">
                {mesFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                      selectedFile.path === file.path 
                        ? 'bg-emerald-950/60 text-emerald-300 font-semibold border-l-2 border-emerald-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                    <span className="font-mono text-[11px] truncate">{file.filename}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Connectivity Files */}
            <div>
              <div className="text-[11px] font-bold text-amber-400 flex items-center space-x-1 mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>BladyProduction.Connectivity (OPC UA)</span>
              </div>
              <div className="pl-4 space-y-1">
                {connectivityFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                      selectedFile.path === file.path 
                        ? 'bg-amber-950/60 text-amber-300 font-semibold border-l-2 border-amber-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span className="font-mono text-[11px] truncate">{file.filename}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shared Kernel */}
            <div>
              <div className="text-[11px] font-bold text-purple-400 flex items-center space-x-1 mb-1">
                <Code2 className="w-3.5 h-3.5" />
                <span>BladyProduction.Shared.Kernel (Événements)</span>
              </div>
              <div className="pl-4 space-y-1">
                {sharedFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                      selectedFile.path === file.path 
                        ? 'bg-purple-950/60 text-purple-300 font-semibold border-l-2 border-purple-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                    <span className="font-mono text-[11px] truncate">{file.filename}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Viewer Toolbar */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-white">
                {selectedFile.path}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {selectedFile.project}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Copier le code C#"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Télécharger ce fichier C#"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 text-xs text-slate-400 italic">
            {selectedFile.description}
          </div>

          {/* Code display with line numbers */}
          <div className="p-4 bg-slate-950 overflow-x-auto max-h-[550px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-300">
            <pre className="table w-full">
              {selectedFile.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60">
                  <span className="table-cell select-none pr-4 text-slate-600 text-right w-10 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {/* Basic syntax highlight colorations */}
                    {line.startsWith('//') ? (
                      <span className="text-emerald-500">{line}</span>
                    ) : line.includes('namespace') || line.includes('using') ? (
                      <span className="text-purple-400">{line}</span>
                    ) : line.includes('public class') || line.includes('public enum') || line.includes('public interface') ? (
                      <span className="text-sky-300 font-bold">{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
