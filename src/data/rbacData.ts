import { AppModuleId, ModulePermissionMap, PermissionLevel, UserAccount, UserRole } from '../types';

export interface ModuleDefinition {
  id: AppModuleId;
  name: string;
  category: 'Fabrication' | 'Gestion & Flux' | 'Qualité & Suivi' | 'Technique & Système';
  description: string;
  defaultAdminLevel: PermissionLevel;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'synoptic',
    name: 'Synoptique Usine',
    category: 'Fabrication',
    description: 'Vue d’ensemble animée de la ligne de fabrication, état des cuves et flux matières en temps réel.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'mes',
    name: 'MES (Suivi d’Atelier)',
    category: 'Fabrication',
    description: 'Pilotage des Ordres de Fabrication (OF), déclaration des unités produites et des rebuts.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'planning',
    name: 'Planning & Gantt',
    category: 'Fabrication',
    description: 'Ordonnancement des ordres de fabrication sur les lignes de conditionnement et réacteurs.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'erp',
    name: 'ERP (Achats & Stocks)',
    category: 'Gestion & Flux',
    description: 'Gestion des articles, nomenclatures (BOM), réceptions fournisseurs et calcul MRP des besoins nets.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'analytics',
    name: 'Analytics (OEE & TRS)',
    category: 'Gestion & Flux',
    description: 'Indicateurs TRS sur 30 jours, disponibilité comparée par machine, prédictions et rentabilité.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'quality',
    name: 'Contrôle Qualité',
    category: 'Qualité & Suivi',
    description: 'Validation physico-chimique des lots, gestion des quarantaines et libération des produits finis.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'traceability',
    name: 'Traçabilité Descendante',
    category: 'Qualité & Suivi',
    description: 'Arbre généalogique D3.js des lots de matières premières vers les produits finis expédiés.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'maintenance',
    name: 'Journal Maintenance',
    category: 'Technique & Système',
    description: 'Historique des pannes, gestion des interventions curatives/préventives, calcul MTBF et MTTR.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'connectivity',
    name: 'Connectivité Industrielle',
    category: 'Technique & Système',
    description: 'Serveurs OPC UA, passerelles Modbus TCP, télémétrie capteurs temps réel et logs Cloud.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'csharp',
    name: 'Architecture C# (.NET)',
    category: 'Technique & Système',
    description: 'Code source et patterns Monolithe Modulaire C# .NET 8/9 de la solution industrielle.',
    defaultAdminLevel: 'admin'
  },
  {
    id: 'admin',
    name: 'Administration & RBAC',
    category: 'Technique & Système',
    description: 'Gestion des comptes utilisateurs, attribution des rôles et contrôle d’accès modulaire.',
    defaultAdminLevel: 'admin'
  }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, ModulePermissionMap> = {
  admin: {
    synoptic: 'admin',
    erp: 'admin',
    mes: 'admin',
    planning: 'admin',
    quality: 'admin',
    traceability: 'admin',
    analytics: 'admin',
    connectivity: 'admin',
    maintenance: 'admin',
    csharp: 'admin',
    admin: 'admin'
  },
  supervisor: {
    synoptic: 'admin',
    erp: 'write',
    mes: 'admin',
    planning: 'admin',
    quality: 'write',
    traceability: 'read',
    analytics: 'read',
    connectivity: 'read',
    maintenance: 'write',
    csharp: 'read',
    admin: 'none'
  },
  operator: {
    synoptic: 'read',
    erp: 'none',
    mes: 'write',
    planning: 'read',
    quality: 'none',
    traceability: 'none',
    analytics: 'none',
    connectivity: 'read',
    maintenance: 'read',
    csharp: 'none',
    admin: 'none'
  },
  quality: {
    synoptic: 'read',
    erp: 'read',
    mes: 'read',
    planning: 'read',
    quality: 'admin',
    traceability: 'admin',
    analytics: 'read',
    connectivity: 'none',
    maintenance: 'none',
    csharp: 'none',
    admin: 'none'
  },
  maintenance: {
    synoptic: 'read',
    erp: 'read',
    mes: 'read',
    planning: 'read',
    quality: 'none',
    traceability: 'none',
    analytics: 'read',
    connectivity: 'admin',
    maintenance: 'admin',
    csharp: 'none',
    admin: 'none'
  }
};

export const INITIAL_USERS: UserAccount[] = [
  {
    uid: 'user-admin-01',
    email: 'infos@blady-product.com',
    displayName: 'Zahir KHODJA',
    role: 'admin',
    active: true,
    jobTitle: 'Directeur Général & Administrateur Système',
    avatarColor: '#f43f5e',
    createdAt: '2026-01-15T08:00:00Z',
    lastLogin: '2026-10-04T10:45:00Z',
    modulePermissions: { ...DEFAULT_ROLE_PERMISSIONS.admin }
  },
  {
    uid: 'user-sup-01',
    email: 'superviseur@usine-blady.fr',
    displayName: 'Jean Dupont',
    role: 'supervisor',
    active: true,
    jobTitle: 'Chef d’Atelier & Superviseur MES',
    avatarColor: '#0ea5e9',
    createdAt: '2026-02-01T08:30:00Z',
    lastLogin: '2026-10-04T09:15:00Z',
    modulePermissions: { ...DEFAULT_ROLE_PERMISSIONS.supervisor }
  },
  {
    uid: 'user-op-01',
    email: 'operateur@usine-blady.fr',
    displayName: 'Marc Vallet',
    role: 'operator',
    active: true,
    jobTitle: 'Conducteur de Ligne de Conditionnement',
    avatarColor: '#10b981',
    createdAt: '2026-03-10T07:45:00Z',
    lastLogin: '2026-10-04T08:00:00Z',
    modulePermissions: { ...DEFAULT_ROLE_PERMISSIONS.operator }
  },
  {
    uid: 'user-qual-01',
    email: 'qualite@khodja-co.com',
    displayName: 'Sarah Benali',
    role: 'quality',
    active: true,
    jobTitle: 'Responsable Assurance Qualité & Lots',
    avatarColor: '#a855f7',
    createdAt: '2026-02-15T09:00:00Z',
    lastLogin: '2026-10-03T16:20:00Z',
    modulePermissions: { ...DEFAULT_ROLE_PERMISSIONS.quality }
  },
  {
    uid: 'user-maint-01',
    email: 'maintenance@khodja-co.com',
    displayName: 'Karim Meziane',
    role: 'maintenance',
    active: true,
    jobTitle: 'Technicien Supérieur Maintenance Industrielle',
    avatarColor: '#f59e0b',
    createdAt: '2026-02-20T10:00:00Z',
    lastLogin: '2026-10-04T07:30:00Z',
    modulePermissions: { ...DEFAULT_ROLE_PERMISSIONS.maintenance }
  }
];

export const ROLE_LABELS: Record<UserRole, { label: string; badgeClass: string; description: string }> = {
  admin: {
    label: 'Administrateur Système',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    description: 'Gestion intégrale des utilisateurs, des rôles et des droits par module. Pleins pouvoirs système.'
  },
  supervisor: {
    label: 'Superviseur de Production',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
    description: 'Ordonnancement OF, ajustements stocks, suivi TRS et validation des déclarations opérateurs.'
  },
  operator: {
    label: 'Opérateur Machine',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    description: 'Pilotage pupitre ligne, saisie des quantités produites et signalement des micro-arrêts.'
  },
  quality: {
    label: 'Responsable Qualité',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
    description: 'Contrôle physico-chimique des lots, mise en quarantaine et traçabilité réglementaire.'
  },
  maintenance: {
    label: 'Technicien Maintenance',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    description: 'Diagnostic des pannes, saisie des interventions curatives/préventives et télémétrie capteurs.'
  }
};

export const PERMISSION_LABELS: Record<PermissionLevel, { label: string; shortLabel: string; colorClass: string }> = {
  none: {
    label: 'Accès Désactivé',
    shortLabel: 'Bloqué',
    colorClass: 'text-slate-500 bg-slate-900/60 border-slate-800'
  },
  read: {
    label: 'Consultation Seule (Lecture)',
    shortLabel: 'Lecture',
    colorClass: 'text-sky-300 bg-sky-950/60 border-sky-800/80'
  },
  write: {
    label: 'Opérationnel (Lecture & Écriture)',
    shortLabel: 'Écriture',
    colorClass: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/80'
  },
  admin: {
    label: 'Contrôle Total (Admin)',
    shortLabel: 'Admin',
    colorClass: 'text-rose-300 bg-rose-950/60 border-rose-800/80'
  }
};

export function hasModuleAccess(
  permissions: ModulePermissionMap | undefined,
  moduleId: AppModuleId,
  requiredLevel: PermissionLevel = 'read'
): boolean {
  if (!permissions) return false;
  const current = permissions[moduleId] || 'none';

  if (requiredLevel === 'none') return true;
  if (current === 'admin') return true;
  if (requiredLevel === 'admin') return false;
  if (requiredLevel === 'write') return current === 'write';
  if (requiredLevel === 'read') return current === 'read' || current === 'write';
  return false;
}
