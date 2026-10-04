import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Search,
  Filter,
  Layers,
  Activity,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Building,
  UserCheck,
  UserX,
  ExternalLink,
  Sliders,
  Shield,
  Clock,
  Eye,
  LogIn
} from 'lucide-react';
import {
  AppModuleId,
  ModulePermissionMap,
  PermissionLevel,
  UserAccount,
  UserRole
} from '../types';
import {
  MODULE_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
  PERMISSION_LABELS
} from '../data/rbacData';
import { useAuth } from '../context/AuthContext';

interface UserRoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersList: UserAccount[];
  onUpdateUser: (updatedUser: UserAccount) => void;
  onCreateUser: (newUser: UserAccount) => void;
  onDeleteUser: (uid: string) => void;
  onSwitchUser?: (user: UserAccount) => void;
}

export const UserRoleManagementModal: React.FC<UserRoleManagementModalProps> = ({
  isOpen,
  onClose,
  usersList,
  onUpdateUser,
  onCreateUser,
  onDeleteUser,
  onSwitchUser
}) => {
  const { profile } = useAuth();

  // Internal Tabs: 'users' | 'matrix' | 'create'
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'create'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Currently inspected/edited user
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(usersList[0] || null);
  const [editedPermissions, setEditedPermissions] = useState<ModulePermissionMap>(
    usersList[0]?.modulePermissions || DEFAULT_ROLE_PERMISSIONS.admin
  );
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // New User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');
  const [newCustomPermissions, setNewCustomPermissions] = useState<ModulePermissionMap>(
    { ...DEFAULT_ROLE_PERMISSIONS.operator }
  );
  const [createError, setCreateError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle selecting a user to edit
  const handleSelectUser = (u: UserAccount) => {
    setSelectedUser(u);
    setEditedPermissions({ ...u.modulePermissions });
    setSaveSuccess(null);
  };

  // Change permission for a module
  const handlePermissionChange = (moduleId: AppModuleId, level: PermissionLevel) => {
    setEditedPermissions((prev) => ({
      ...prev,
      [moduleId]: level
    }));
  };

  // Save changes to selected user
  const handleSaveUserPermissions = () => {
    if (!selectedUser) return;
    const updated: UserAccount = {
      ...selectedUser,
      modulePermissions: { ...editedPermissions }
    };
    onUpdateUser(updated);
    setSelectedUser(updated);
    setSaveSuccess(`Droits du compte ${updated.displayName} mis à jour avec succès.`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // Apply standard preset to selected user
  const handleApplyRolePreset = (role: UserRole) => {
    if (!selectedUser) return;
    const preset = DEFAULT_ROLE_PERMISSIONS[role];
    setEditedPermissions({ ...preset });
    const updated: UserAccount = {
      ...selectedUser,
      role: role,
      modulePermissions: { ...preset }
    };
    onUpdateUser(updated);
    setSelectedUser(updated);
    setSaveSuccess(`Rôle réattribué à "${ROLE_LABELS[role].label}" avec ses droits par défaut.`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // Toggle active/inactive
  const handleToggleUserActive = (u: UserAccount) => {
    if (u.role === 'admin' && usersList.filter((x) => x.role === 'admin' && x.active).length <= 1 && u.active) {
      alert("Impossible de désactiver le dernier compte administrateur actif du système.");
      return;
    }
    const updated: UserAccount = {
      ...u,
      active: !u.active
    };
    onUpdateUser(updated);
    if (selectedUser?.uid === u.uid) {
      setSelectedUser(updated);
    }
  };

  // When changing role in creation form, auto-fill default permissions
  const handleNewRoleChange = (role: UserRole) => {
    setNewRole(role);
    setNewCustomPermissions({ ...DEFAULT_ROLE_PERMISSIONS[role] });
  };

  // Handle Create User
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newEmail || !newName) {
      setCreateError('Veuillez renseigner un nom et une adresse e-mail valide.');
      return;
    }

    if (usersList.some((u) => u.email.toLowerCase() === newEmail.toLowerCase().trim())) {
      setCreateError('Un compte avec cette adresse e-mail existe déjà.');
      return;
    }

    const newUser: UserAccount = {
      uid: `user-${Date.now()}`,
      email: newEmail.toLowerCase().trim(),
      displayName: newName.trim(),
      jobTitle: newJobTitle.trim() || ROLE_LABELS[newRole].label,
      role: newRole,
      active: true,
      createdAt: new Date().toISOString(),
      avatarColor: newRole === 'admin' ? '#f43f5e' : (newRole === 'supervisor' ? '#0ea5e9' : '#10b981'),
      modulePermissions: { ...newCustomPermissions }
    };

    onCreateUser(newUser);
    // Reset form
    setNewEmail('');
    setNewName('');
    setNewJobTitle('');
    setNewRole('operator');
    setNewCustomPermissions({ ...DEFAULT_ROLE_PERMISSIONS.operator });
    setActiveTab('users');
    handleSelectUser(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Administration des Rôles & Droits d'Accès (RBAC)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800">
                  KHODJA & Co. • Sécurité Usine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Contrôle d'accès unifié par module : Définissez les utilisateurs, attribuez les rôles industriels et configurez les droits fins (Lecture, Écriture, Admin).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Fermer la console d'administration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/50 border-b border-slate-800/80 text-xs">
          <div className="px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Total Comptes :</span>
            <span className="font-mono font-bold text-white">{usersList.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Administrateurs :</span>
            <span className="font-mono font-bold text-rose-400">
              {usersList.filter((u) => u.role === 'admin' && u.active).length}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Comptes Actifs :</span>
            <span className="font-mono font-bold text-emerald-400">
              {usersList.filter((u) => u.active).length} / {usersList.length}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Modules Couverts :</span>
            <span className="font-mono font-bold text-sky-400">{MODULE_DEFINITIONS.length}</span>
          </div>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center px-6 pt-3 bg-slate-950/30 border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'users'
                ? 'bg-slate-900 text-sky-400 border-slate-700 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestion Utilisateurs ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-sky-400 border-slate-700 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Matrice Complète des Droits</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'create'
                ? 'bg-slate-900 text-emerald-400 border-slate-700 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Créer un Compte</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: USERS LIST & EDIT PERMISSIONS */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Users Directory */}
              <div className="lg:col-span-5 space-y-3">
                
                {/* Search & Role Filter Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                    <button
                      onClick={() => setRoleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        roleFilter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      Tous
                    </button>
                    {(['admin', 'supervisor', 'operator', 'quality', 'maintenance'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-2 py-1 rounded-lg font-medium transition-all ${
                          roleFilter === r ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {ROLE_LABELS[r].label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Users List Cards */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredUsers.map((u) => {
                    const isSelected = selectedUser?.uid === u.uid;
                    const roleInfo = ROLE_LABELS[u.role];

                    return (
                      <div
                        key={u.uid}
                        onClick={() => handleSelectUser(u)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 ${
                          isSelected
                            ? 'bg-slate-800/90 border-sky-500/80 shadow-md ring-1 ring-sky-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        } ${!u.active ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner"
                              style={{ backgroundColor: u.avatarColor || '#0284c7' }}
                            >
                              {u.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center space-x-1.5">
                                <span>{u.displayName}</span>
                                {!u.active && (
                                  <span className="text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.2 rounded border border-rose-800">
                                    Suspendu
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{u.email}</div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleInfo.badgeClass}`}>
                            {roleInfo.label.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span className="truncate max-w-[160px]">{u.jobTitle || 'Poste non précisé'}</span>
                          <span className="font-mono text-slate-500">
                            {u.role === 'admin' ? 'Contrôle total' : 'Droits restreints'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-500 italic">
                      Aucun utilisateur correspondant à votre recherche.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Permission Details & Editor for Selected User */}
              <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-5">
                {selectedUser ? (
                  <>
                    {/* User Profile Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-inner"
                          style={{ backgroundColor: selectedUser.avatarColor || '#0284c7' }}
                        >
                          {selectedUser.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-base font-bold text-white">{selectedUser.displayName}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_LABELS[selectedUser.role].badgeClass}`}>
                              {ROLE_LABELS[selectedUser.role].label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {selectedUser.email} • {selectedUser.jobTitle}
                          </p>
                        </div>
                      </div>

                      {/* User Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {onSwitchUser && (
                          <button
                            onClick={() => onSwitchUser(selectedUser)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 transition-colors flex items-center space-x-1"
                            title="Tester la session avec ce compte"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Tester la Session</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleUserActive(selectedUser)}
                          className={`p-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            selectedUser.active
                              ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
                              : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                          }`}
                          title={selectedUser.active ? 'Suspendre ce compte' : 'Réactiver ce compte'}
                        >
                          {selectedUser.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {selectedUser.uid !== 'user-admin-01' && (
                          <button
                            onClick={() => {
                              if (confirm(`Confirmez-vous la suppression définitive du compte ${selectedUser.displayName} ?`)) {
                                onDeleteUser(selectedUser.uid);
                                setSelectedUser(usersList[0] || null);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Supprimer définitivement ce compte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Feedback Alert Banner */}
                    {saveSuccess && (
                      <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-3 text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{saveSuccess}</span>
                      </div>
                    )}

                    {/* Role Presets Bar */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-300 block">
                        Attribuer un Rôle Prédéfini Usine :
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                        {(['admin', 'supervisor', 'operator', 'quality', 'maintenance'] as UserRole[]).map((r) => {
                          const isCurrent = selectedUser.role === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleApplyRolePreset(r)}
                              className={`p-2 rounded-xl text-left border transition-all ${
                                isCurrent
                                  ? 'bg-slate-800 border-sky-500 text-white font-semibold shadow-sm'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              <div className="text-[11px] font-bold truncate">{ROLE_LABELS[r].label.split(' ')[0]}</div>
                              <div className="text-[9px] text-slate-500 capitalize">{r}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Granular Module Rights Matrix for Selected User */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <Sliders className="w-3.5 h-3.5 text-sky-400" />
                          <span>Droits Granulaires par Module :</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Configurez les privilèges pour chaque brique logicielle
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                        {MODULE_DEFINITIONS.map((mod) => {
                          const currentLevel = editedPermissions[mod.id] || 'none';

                          return (
                            <div
                              key={mod.id}
                              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-slate-200 text-xs">{mod.name}</span>
                                  <span className="text-[9px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                                    {mod.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{mod.description}</p>
                              </div>

                              {/* 4-level permission toggle buttons */}
                              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] shrink-0 self-start sm:self-auto">
                                {(['none', 'read', 'write', 'admin'] as PermissionLevel[]).map((lvl) => {
                                  const isSelected = currentLevel === lvl;
                                  const info = PERMISSION_LABELS[lvl];

                                  return (
                                    <button
                                      key={lvl}
                                      type="button"
                                      onClick={() => handlePermissionChange(mod.id, lvl)}
                                      className={`px-2 py-1 rounded-lg font-medium transition-all ${
                                        isSelected
                                          ? `${info.colorClass} font-bold shadow-sm`
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title={info.label}
                                    >
                                      {info.shortLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Save Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Les modifications prennent effet immédiatement en temps réel.</span>
                      </div>

                      <button
                        onClick={handleSaveUserPermissions}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md flex items-center space-x-1.5 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer les Droits</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs italic">
                    Sélectionnez un utilisateur à gauche pour inspecter ou modifier ses droits.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: OVERALL PERMISSIONS MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Matrice Globale des Droits d'Accès par Rôle</h4>
                  <p className="text-xs text-slate-400">
                    Vue synoptique des privilèges accordés pour les 5 profils types sur les 11 modules industriels.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">Admin</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">Écriture</span>
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">Lecture</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-bold">Bloqué</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Module Logiciel</th>
                      <th className="py-3 px-3 font-semibold">Catégorie</th>
                      <th className="py-3 px-3 font-semibold text-center text-rose-400">Admin Système</th>
                      <th className="py-3 px-3 font-semibold text-center text-sky-400">Superviseur MES</th>
                      <th className="py-3 px-3 font-semibold text-center text-emerald-400">Opérateur</th>
                      <th className="py-3 px-3 font-semibold text-center text-purple-400">Qualité</th>
                      <th className="py-3 px-3 font-semibold text-center text-amber-400">Maintenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {MODULE_DEFINITIONS.map((m) => {
                      const adminLvl = DEFAULT_ROLE_PERMISSIONS.admin[m.id];
                      const supLvl = DEFAULT_ROLE_PERMISSIONS.supervisor[m.id];
                      const opLvl = DEFAULT_ROLE_PERMISSIONS.operator[m.id];
                      const qualLvl = DEFAULT_ROLE_PERMISSIONS.quality[m.id];
                      const maintLvl = DEFAULT_ROLE_PERMISSIONS.maintenance[m.id];

                      const renderBadge = (lvl: PermissionLevel) => {
                        const info = PERMISSION_LABELS[lvl];
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${info.colorClass}`}>
                            {info.shortLabel}
                          </span>
                        );
                      };

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-100">
                            <div>{m.name}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{m.description}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {m.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">{renderBadge(adminLvl)}</td>
                          <td className="py-3 px-3 text-center">{renderBadge(supLvl)}</td>
                          <td className="py-3 px-3 text-center">{renderBadge(opLvl)}</td>
                          <td className="py-3 px-3 text-center">{renderBadge(qualLvl)}</td>
                          <td className="py-3 px-3 text-center">{renderBadge(maintLvl)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW USER ACCOUNT FORM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="max-w-2xl mx-auto space-y-5 bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Création d'un Nouveau Compte Utilisateur</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Renseignez l'identité du collaborateur et attribuez-lui son rôle initial avec ses privilèges modaux.
                </p>
              </div>

              {createError && (
                <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-3 text-xs text-rose-200 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Nom et Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sophie Martin"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Adresse E-mail Professionnelle *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: sophie.martin@khodja-co.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Intitulé du Poste / Fonction</label>
                  <input
                    type="text"
                    placeholder="Ex: Adjoint Chef d’Atelier"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Rôle Système Attribué</label>
                  <select
                    value={newRole}
                    onChange={(e) => handleNewRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="operator">Opérateur Machine (Saisie d'atelier)</option>
                    <option value="supervisor">Superviseur de Production (MES & Planning)</option>
                    <option value="quality">Responsable Qualité (Contrôles & Lots)</option>
                    <option value="maintenance">Technicien Maintenance (Interventions)</option>
                    <option value="admin">Administrateur Système (Pleins pouvoirs)</option>
                  </select>
                </div>
              </div>

              {/* Roles explanation card */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-sky-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Rôle sélectionné : {ROLE_LABELS[newRole].label}</span>
                </div>
                <p className="text-[11px] text-slate-300">{ROLE_LABELS[newRole].description}</p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Créer et Activer le Compte</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
