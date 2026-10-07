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
  GitFork,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { BladyLogo } from './BladyLogo';
import { useAuth } from '../context/AuthContext';
import { AudioBackgroundPlayer } from './AudioBackgroundPlayer';
import { hasModuleAccess } from '../data/rbacData';
import { AppModuleId } from '../types';

interface NavbarProps {
  activeTab: 'synoptic' | 'erp' | 'mes' | 'planning' | 'quality' | 'traceability' | 'analytics' | 'connectivity' | 'csharp' | 'maintenance';
  setActiveTab: (tab: 'synoptic' | 'erp' | 'mes' | 'planning' | 'quality' | 'traceability' | 'analytics' | 'connectivity' | 'csharp' | 'maintenance') => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  onResetData: () => void;
  criticalAlertCount: number;
  qualityAlertCount?: number;
  telemetryAlertCount?: number;
  onOpenUserManagement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  onResetData,
  criticalAlertCount,
  qualityAlertCount = 0,
  telemetryAlertCount = 0,
  onOpenUserManagement
}) => {
  const { user, profile, dbConnected, loginWithGoogle, logout } = useAuth();

  const canAccess = (moduleId: AppModuleId): boolean => {
    if (!profile || profile.role === 'admin') return true;
    return hasModuleAccess(profile.modulePermissions, moduleId, 'read');
  };

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
              } ${!canAccess('erp') ? 'opacity-60' : ''}`}
              title={!canAccess('erp') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <Boxes className="w-4 h-4" />
              <span>Module ERP</span>
              {!canAccess('erp') && <Lock className="w-3 h-3 text-slate-500" />}
              {criticalAlertCount > 0 && canAccess('erp') && (
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
              } ${!canAccess('mes') ? 'opacity-60' : ''}`}
              title={!canAccess('mes') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <Layers className="w-4 h-4" />
              <span>Module MES & TRS</span>
              {!canAccess('mes') && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button
              id="nav-tab-planning"
              onClick={() => setActiveTab('planning')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'planning'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${!canAccess('planning') ? 'opacity-60' : ''}`}
              title={!canAccess('planning') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <CalendarRange className="w-4 h-4 text-indigo-400" />
              <span>Planning Gantt</span>
              {!canAccess('planning') && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button
              id="nav-tab-quality"
              onClick={() => setActiveTab('quality')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'quality'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${!canAccess('quality') ? 'opacity-60' : ''}`}
              title={!canAccess('quality') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>Contrôle Qualité</span>
              {!canAccess('quality') && <Lock className="w-3 h-3 text-slate-500" />}
              {qualityAlertCount > 0 && canAccess('quality') && (
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
              } ${!canAccess('traceability') ? 'opacity-60' : ''}`}
              title={!canAccess('traceability') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <GitFork className="w-4 h-4 text-indigo-400" />
              <span>Traçabilité Lots</span>
              {!canAccess('traceability') && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${!canAccess('analytics') ? 'opacity-60' : ''}`}
              title={!canAccess('analytics') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Analytique & OEE</span>
              {!canAccess('analytics') && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button
              id="nav-tab-maintenance"
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${!canAccess('maintenance') ? 'opacity-60' : ''}`}
              title={!canAccess('maintenance') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Journal Maintenance</span>
              {!canAccess('maintenance') && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button
              id="nav-tab-connectivity"
              onClick={() => setActiveTab('connectivity')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'connectivity'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${!canAccess('connectivity') ? 'opacity-60' : ''}`}
              title={!canAccess('connectivity') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Connectivité Industrielle</span>
              {!canAccess('connectivity') && <Lock className="w-3 h-3 text-slate-500" />}
              {telemetryAlertCount > 0 && canAccess('connectivity') && (
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
              } ${!canAccess('csharp') ? 'opacity-60' : ''}`}
              title={!canAccess('csharp') ? 'Accès restreint par politique RBAC' : undefined}
            >
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-indigo-200">Architecture C# (.NET)</span>
              {!canAccess('csharp') && <Lock className="w-3 h-3 text-slate-500" />}
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

            {/* Admin RBAC Button (Exclusive to Administrator) */}
            {profile?.role === 'admin' && onOpenUserManagement && (
              <button
                id="btn-navbar-admin-rbac"
                onClick={onOpenUserManagement}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-950/90 to-slate-900 border border-rose-500/70 hover:border-rose-400 text-rose-200 hover:text-white transition-all shadow-md shadow-rose-950/40"
                title="Gérer les utilisateurs, les rôles et les droits par module"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Gestion Droits (RBAC)</span>
              </button>
            )}

            {/* Auth / User profile */}
            {user ? (
              <div 
                className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs cursor-pointer hover:border-slate-700 transition-colors"
                onClick={() => {
                  if (profile?.role === 'admin' && onOpenUserManagement) {
                    onOpenUserManagement();
                  }
                }}
                title={profile?.role === 'admin' ? "Cliquez pour ouvrir la console d'administration" : undefined}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full" />
                ) : (
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: profile?.role === 'admin' ? '#f43f5e' : '#0284c7' }}
                  >
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-semibold text-white leading-tight truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className={`text-[9px] font-mono capitalize ${profile?.role === 'admin' ? 'text-rose-400 font-bold' : 'text-sky-400'}`}>
                    {profile?.role === 'admin' ? 'Administrateur' : (profile?.role || 'Opérateur')}
                  </div>
                </div>
                <button
                  id="btn-navbar-logout"
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
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

      {/* Industrial status and responsive navigation row */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md space-x-2 text-xs scrollbar-none shadow-inner">
        {/* Live Industrial Line Status Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 shrink-0 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="font-bold text-slate-200">Ligne 01</span>
          <span className="text-slate-600">•</span>
          <span className={isSimulating ? "text-emerald-400 font-semibold" : "text-slate-400"}>
            {isSimulating ? "En Production" : "En Pause"}
          </span>
        </div>

        <button
          onClick={() => setActiveTab('synoptic')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'synoptic'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Synoptique</span>
        </button>

        <button
          onClick={() => setActiveTab('erp')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'erp'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('erp') ? 'opacity-60' : ''}`}
          title={!canAccess('erp') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>ERP</span>
          {!canAccess('erp') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
          {criticalAlertCount > 0 && canAccess('erp') && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50">
              {criticalAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mes')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'mes'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('mes') ? 'opacity-60' : ''}`}
          title={!canAccess('mes') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>MES & TRS</span>
          {!canAccess('mes') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('planning')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'planning'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('planning') ? 'opacity-60' : ''}`}
          title={!canAccess('planning') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <CalendarRange className="w-3.5 h-3.5 text-indigo-400" />
          <span>Planning</span>
          {!canAccess('planning') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'quality'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('quality') ? 'opacity-60' : ''}`}
          title={!canAccess('quality') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
          <span>Qualité</span>
          {!canAccess('quality') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
          {qualityAlertCount > 0 && canAccess('quality') && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50 animate-pulse">
              {qualityAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'traceability'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('traceability') ? 'opacity-60' : ''}`}
          title={!canAccess('traceability') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <GitFork className="w-3.5 h-3.5 text-indigo-400" />
          <span>Traçabilité</span>
          {!canAccess('traceability') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('analytics') ? 'opacity-60' : ''}`}
          title={!canAccess('analytics') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>OEE & TRS</span>
          {!canAccess('analytics') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'maintenance'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('maintenance') ? 'opacity-60' : ''}`}
          title={!canAccess('maintenance') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Maintenance</span>
          {!canAccess('maintenance') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('connectivity')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'connectivity'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          } ${!canAccess('connectivity') ? 'opacity-60' : ''}`}
          title={!canAccess('connectivity') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>Connectivité</span>
          {!canAccess('connectivity') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
          {telemetryAlertCount > 0 && canAccess('connectivity') && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50 animate-pulse">
              {telemetryAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('csharp')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'csharp'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-300 hover:text-white hover:bg-indigo-950/40'
          } ${!canAccess('csharp') ? 'opacity-60' : ''}`}
          title={!canAccess('csharp') ? 'Accès restreint par politique RBAC' : undefined}
        >
          <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Architecture C#</span>
          {!canAccess('csharp') && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>
      </div>
    </header>
  );
};
