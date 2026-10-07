import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, Users, KeyRound, ExternalLink } from 'lucide-react';
import { AppModuleId } from '../types';
import { MODULE_DEFINITIONS, ROLE_LABELS } from '../data/rbacData';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedViewProps {
  moduleId: AppModuleId;
  onGoToAllowedTab: (tab: 'synoptic' | 'mes') => void;
  onOpenAdminConsole?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  moduleId,
  onGoToAllowedTab,
  onOpenAdminConsole
}) => {
  const { profile } = useAuth();
  const moduleDef = MODULE_DEFINITIONS.find((m) => m.id === moduleId);
  const roleInfo = profile ? ROLE_LABELS[profile.role] : null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-inner">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800/80">
            <Lock className="w-3.5 h-3.5" />
            <span>Sécurité Usine • Contrôle d'Accès RBAC</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Accès Non Autorisé au Module
          </h2>
          <p className="text-base text-slate-300">
            Le module <strong className="text-white">« {moduleDef?.name || moduleId} »</strong> n'est pas accessible avec votre profil actuel.
          </p>
        </div>

        {/* Current Role and Permissions Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400">Votre profil connecté :</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${roleInfo?.badgeClass || 'bg-slate-800 text-slate-300'}`}>
              {roleInfo?.label || 'Utilisateur'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Statut du module :</span>
              <span className="font-mono text-rose-400 font-semibold">Accès Bloqué (none)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Privilège requis :</span>
              <span className="font-mono text-sky-400 font-semibold">Lecture (read) ou Écriture (write)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 leading-relaxed">
            Pour modifier vos habilitations, veuillez vous adresser à <strong className="text-white">Zahir KHODJA</strong> (<em className="text-slate-300">Directeur Général & Administrateur Système</em>).
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onGoToAllowedTab('synoptic')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md flex items-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner au Synoptique Usine</span>
          </button>

          <button
            onClick={() => onGoToAllowedTab('mes')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Ouvrir l'Atelier MES</span>
          </button>

          {profile?.role === 'admin' && onOpenAdminConsole && (
            <button
              onClick={onOpenAdminConsole}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 transition-colors flex items-center space-x-2"
            >
              <KeyRound className="w-4 h-4 text-rose-400" />
              <span>Gérer les Droits (Admin)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
