import React from 'react';
import { 
  Factory, 
  Layers, 
  Cpu, 
  FileCode2, 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  Boxes,
  BarChart3,
  Database,
  LogIn,
  LogOut,
  User,
  Wrench,
  CalendarRange,
  ExternalLink,
  FileText,
  FlaskConical,
  GitFork
} from 'lucide-react';
import { BladyLogo } from './BladyLogo';
import { useAuth } from '../context/AuthContext';
import { AudioBackgroundPlayer } from './AudioBackgroundPlayer';

interface NavbarProps {
  activeTab: 'synoptic' | 'erp' | 'mes' | 'planning' | 'quality' | 'traceability' | 'analytics' | 'connectivity' | 'csharp' | 'maintenance';
  setActiveTab: (tab: 'synoptic' | 'erp' | 'mes' | 'planning' | 'quality' | 'traceability' | 'analytics' | 'connectivity' | 'csharp' | 'maintenance') => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  onResetData: () => void;
  criticalAlertCount: number;
  qualityAlertCount?: number;
  telemetryAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  onResetData,
  criticalAlertCount,
  qualityAlertCount = 0,
  telemetryAlertCount = 0
}) => {
  const { user, profile, dbConnected, loginWithGoogle, logout } = useAuth();
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('synoptic')}>
              <BladyLogo className="w-11 h-11 drop-shadow-md hover:scale-105 transition-transform duration-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>BladyProduction</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  KHODJA & Co.
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  .NET 8/9
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                ERP + MES + Connectivité Process Liquides & Agroalimentaire
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-synoptic"
              onClick={() => setActiveTab('synoptic')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'synoptic'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Synoptique Usine</span>
            </button>

            <button
              id="nav-tab-erp"
              onClick={() => setActiveTab('erp')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'erp'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Module ERP</span>
              {criticalAlertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50">
                  {criticalAlertCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-mes"
              onClick={() => setActiveTab('mes')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'mes'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Module MES & TRS</span>
            </button>

            <button
              id="nav-tab-planning"
              onClick={() => setActiveTab('planning')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'planning'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CalendarRange className="w-4 h-4 text-indigo-400" />
              <span>Planning Gantt</span>
            </button>

            <button
              id="nav-tab-quality"
              onClick={() => setActiveTab('quality')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'quality'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>Contrôle Qualité</span>
              {qualityAlertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50 animate-pulse">
                  {qualityAlertCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-traceability"
              onClick={() => setActiveTab('traceability')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'traceability'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitFork className="w-4 h-4 text-indigo-400" />
              <span>Traçabilité Lots</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Analytique & OEE</span>
            </button>

            <button
              id="nav-tab-maintenance"
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Journal Maintenance</span>
            </button>

            <button
              id="nav-tab-connectivity"
              onClick={() => setActiveTab('connectivity')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'connectivity'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Connectivité Industrielle</span>
              {telemetryAlertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50 animate-pulse">
                  {telemetryAlertCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-csharp"
              onClick={() => setActiveTab('csharp')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'csharp'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/40'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-indigo-200">Architecture C# (.NET)</span>
            </button>
          </nav>

          {/* Quick controls, database status & auth */}
          <div className="flex items-center space-x-2.5">
            {/* Musique douce d'ambiance avec contrôle de volume */}
            <AudioBackgroundPlayer />

            {/* Démo HTML Autonome Link */}
            <a
              href="/monusine-standalone.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors shadow-sm"
              title="Consulter ou télécharger la maquette HTML statique et autonome"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Démo HTML</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            {/* Database indicator */}
            <div 
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-slate-950/80 border border-slate-800 text-slate-300"
              title="Base de données Cloud Firestore connectée"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono text-slate-300">Firestore</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
            </div>

            {/* Auth / User profile */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-sky-700 flex items-center justify-center text-[10px] text-white font-bold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-semibold text-white leading-tight truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[9px] text-sky-400 font-mono capitalize">
                    {profile?.role || 'Opérateur'}
                  </div>
                </div>
                <button
                  id="btn-navbar-logout"
                  onClick={logout}
                  className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-900 border border-transparent hover:border-rose-900/40 transition-colors ml-1"
                  title="Se déconnecter et retourner à l'écran de connexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden md:inline font-medium">Déconnexion</span>
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-sm shadow-sky-900/50"
                title="Se connecter avec Google Auth"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connexion</span>
              </button>
            )}

            <button
              id="btn-toggle-simulation"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isSimulating
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Activer/Désactiver la télémétrie industrielle en direct"
            >
              {isSimulating ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Simulation Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              )}
            </button>

            <button
              id="btn-reset-data"
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Réinitialiser les données d'usine"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800 bg-slate-950 space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('synoptic')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'synoptic' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          Synoptique
        </button>
        <button
          onClick={() => setActiveTab('erp')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'erp' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          ERP ({criticalAlertCount} alertes)
        </button>
        <button
          onClick={() => setActiveTab('mes')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'mes' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
        >
          MES & TRS
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'planning' ? 'bg-indigo-600 text-white' : 'text-indigo-300'}`}
        >
          Planning
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'quality' ? 'bg-emerald-600 text-white' : 'text-emerald-400'}`}
        >
          Qualité {qualityAlertCount > 0 ? `(${qualityAlertCount} alertes)` : ''}
        </button>
        <button
          onClick={() => setActiveTab('traceability')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'traceability' ? 'bg-indigo-600 text-white' : 'text-indigo-300'}`}
        >
          Traçabilité
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'analytics' ? 'bg-sky-600 text-white' : 'text-emerald-400'}`}
        >
          Analytique & OEE
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'maintenance' ? 'bg-sky-600 text-white' : 'text-amber-400'}`}
        >
          Maintenance
        </button>
        <button
          onClick={() => setActiveTab('connectivity')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'connectivity' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400'}`}
        >
          Connectivité {telemetryAlertCount > 0 ? `(${telemetryAlertCount} alertes)` : ''}
        </button>
        <button
          onClick={() => setActiveTab('csharp')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'csharp' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
        >
          Architecture C#
        </button>
      </div>
    </header>
  );
};
