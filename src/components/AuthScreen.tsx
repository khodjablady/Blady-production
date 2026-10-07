import React, { useState } from 'react';
import { 
  Factory, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Layers, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  KeyRound,
  ExternalLink,
  Info
} from 'lucide-react';
import { BladyLogo } from './BladyLogo';
import { useAuth, getFirebaseAuthErrorMessage } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthScreen: React.FC = () => {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginWithDemo, 
    resetPassword,
    dbConnected 
  } = useAuth();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [providerWarning, setProviderWarning] = useState<boolean>(false);

  // Clear messages on mode switch
  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProviderWarning(false);
  };

  // Submit Handler for Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProviderWarning(false);

    try {
      await loginWithEmail(email, password);
      // Success: App.tsx will automatically transition when user state updates
    } catch (err: any) {
      console.error('[AuthScreen] Login error:', err);
      const friendlyMsg = getFirebaseAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
      if (err?.code === 'auth/operation-not-allowed') {
        setProviderWarning(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Registration (Créer un compte)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProviderWarning(false);

    try {
      await registerWithEmail(
        email, 
        password, 
        displayName || email.split('@')[0], 
        role
      );
      setSuccessMessage('Compte créé avec succès ! Connexion en cours...');
    } catch (err: any) {
      console.error('[AuthScreen] Register error:', err);
      const friendlyMsg = getFirebaseAuthErrorMessage(err);
      setErrorMessage(friendlyMsg);
      if (err?.code === 'auth/operation-not-allowed') {
        setProviderWarning(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Password Reset
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Veuillez saisir votre adresse e-mail pour réinitialiser le mot de passe.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await resetPassword(email);
      setSuccessMessage('Un e-mail de réinitialisation a été envoyé à votre adresse.');
    } catch (err: any) {
      console.error('[AuthScreen] Password reset error:', err);
      setErrorMessage(getFirebaseAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill demo credentials and login
  const handleQuickDemo = (demoRole: UserRole, name: string, demoEmail: string) => {
    setErrorMessage(null);
    setSuccessMessage(`Connexion en cours avec le profil ${name}...`);
    loginWithDemo(demoRole, name, demoEmail);
  };

  const handleFillAdminCredentials = () => {
    setEmail('infos@blady-product.com');
    setPassword('TayakOut24061964');
    setErrorMessage(null);
    setSuccessMessage('Identifiants administrateur appliqués. Cliquez sur "Se connecter au système".');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle industrial grid lines */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
      />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left column: Industrial Branding & Factory Status */}
        <div className="lg:col-span-5 flex flex-col space-y-6 text-left">
          
          {/* Header & Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <BladyLogo className="w-16 h-16 drop-shadow-xl hover:scale-105 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight text-white">BladyProduction</h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  KHODJA & Co.
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  .NET 8/9
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                SNC KHODJA & CO. • Sustainable Culinary Heritage
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                MES • ERP • Connectivité OPC UA Industrielle
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
              Portail d'authentification du Système de Production
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Accédez au pilotage en temps réel des lignes de conditionnement, au calcul MRP des besoins nets, au suivi TRS selon la norme AFNOR NF E60-182 et à la télémétrie industrielle.
            </p>
          </div>

          {/* Plant Real-time Status Card */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Usine Connectée & Prête
              </span>
              <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                ISA-95 / ISA-88
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">TRS Global</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">89.4%</div>
                <div className="text-[9px] text-slate-500">Nominal (&ge;80%)</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Lignes MES</div>
                <div className="text-sm font-bold text-sky-400 font-mono">03 Actives</div>
                <div className="text-[9px] text-slate-500">920 b/min</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Base Données</div>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {dbConnected ? 'En Ligne' : 'Synchronisée'}
                </div>
                <div className="text-[9px] text-slate-500">Cloud Firestore</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-800/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Contrôle d'accès basé sur les rôles (RBAC) conforme aux normes usine.</span>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Accès Rapide par Rôle Usine :</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Clic Instantané</span>
            </div>

            {/* Featured Primary Admin Button */}
            <button
              type="button"
              onClick={() => handleQuickDemo('admin', 'Zahir KHODJA (Directeur Général & Administrateur Système)', 'infos@blady-product.com')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/80 hover:from-rose-900 hover:to-slate-800 border border-rose-500/50 hover:border-rose-400 text-left transition-all shadow-lg shadow-rose-950/40 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition-transform">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-rose-200 flex items-center gap-1.5">
                    <span>Administrateur Système Principal (Accès Rapide 1-Clic)</span>
                    <span className="text-[9px] bg-rose-900/80 text-rose-300 px-1.5 py-0.2 rounded border border-rose-700 font-semibold">
                      Pleins pouvoirs (11 modules)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">
                    Nom : Zahir KHODJA (Directeur Général & Administrateur Système)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    E-mail : infos@blady-product.com • Rôle : admin
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Other Factory Roles Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('supervisor', 'Jean Dupont (Superviseur)', 'superviseur@usine-blady.fr')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-[11px] text-sky-300">Superviseur MES</div>
                  <div className="text-[9px] text-slate-400">OF & Déclarations</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('operator', 'Marc Vallet (Opérateur)', 'operateur@usine-blady.fr')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-[11px] text-emerald-300">Opérateur Machine</div>
                  <div className="text-[9px] text-slate-400">Pilotage Ligne 01</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('quality', 'Sarah Benali (Qualité)', 'qualite@khodja-co.com')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-[11px] text-purple-300">Responsable Qualité</div>
                  <div className="text-[9px] text-slate-400">Lots & Conformité</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('maintenance', 'Karim Meziane (Maintenance)', 'maintenance@khodja-co.com')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                <div>
                  <div className="font-semibold text-[11px] text-amber-300">Technicien Maintenance</div>
                  <div className="text-[9px] text-slate-400">Interventions & MTBF</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Auth Card Form */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
            
            {/* Mode Tabs */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Créer un compte</span>
              </button>
            </div>

            {/* Title / Subtitle depending on mode */}
            <div className="mb-6">
              {mode === 'login' && (
                <div>
                  <h3 className="text-xl font-bold text-white">Connexion à votre espace usine</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Entrez votre adresse e-mail et votre mot de passe pour accéder au système de supervision.
                  </p>
                </div>
              )}
              {mode === 'register' && (
                <div>
                  <h3 className="text-xl font-bold text-white">Création d'un nouveau compte opérateur</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Renseignez vos coordonnées professionnelles et votre rôle au sein de l'usine de production.
                  </p>
                </div>
              )}
              {mode === 'forgot' && (
                <div>
                  <h3 className="text-xl font-bold text-white">Réinitialisation du mot de passe</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Saisissez votre adresse e-mail pour recevoir les instructions de réinitialisation.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/40 flex items-start gap-3 text-xs text-rose-200 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 flex items-start gap-3 text-xs text-emerald-200 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* Provider Warning Notice (if Email/Password is not enabled in Firebase console) */}
            {providerWarning && (
              <div className="mb-5 p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/40 flex items-start gap-3 text-xs text-amber-200">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold text-amber-300">
                    Activation du fournisseur Email/Mot de passe requise :
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    Dans la console Firebase de votre projet, rendez-vous dans <strong>Authentication &gt; Sign-in method</strong> et activez <strong>Email/Password</strong>.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('supervisor', 'Superviseur de Production', email || 'superviseur@usine-blady.fr')}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded text-[11px] font-semibold border border-amber-500/40 transition-colors"
                    >
                      Utiliser l'accès Démo Immédiat
                    </button>
                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 rounded text-[11px] font-semibold border border-sky-500/40 transition-colors"
                    >
                      Se connecter avec Google
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Admin Quick Credentials Fill Helper */}
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start space-x-2.5">
                    <KeyRound className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-rose-200">Administrateur Système Principal</span>
                        <span className="text-[9px] bg-rose-900/80 text-rose-300 px-1.5 py-0.2 rounded border border-rose-700 font-mono font-semibold">
                          admin (Pleins pouvoirs sur les 11 modules)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Nom : <strong className="text-white">Zahir KHODJA</strong> (Directeur Général & Administrateur Système)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        E-mail : <span className="text-rose-300 font-semibold">infos@blady-product.com</span> • Mot de passe : <span className="text-rose-300 font-semibold">TayakOut24061964</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillAdminCredentials}
                    className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600 text-[11px] font-bold transition-all shadow-sm shrink-0 self-end sm:self-auto"
                  >
                    Préremplissage Automatique (1-Clic)
                  </button>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Adresse e-mail professionnelle
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom.prenom@usine-blady.fr"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me option */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900"
                    />
                    <span>Garder ma session active sur ce terminal</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-900/40 border border-sky-400/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Se connecter au système</span>
                    </>
                  )}
                </button>

                {/* Link to Create Account */}
                <div className="text-center pt-3 border-t border-slate-800/80">
                  <p className="text-xs text-slate-400">
                    Pas encore de compte opérateur ou superviseur ?{' '}
                    <button
                      id="link-go-to-register"
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1"
                    >
                      Créer un compte
                    </button>
                  </p>
                </div>

              </form>
            )}

            {/* REGISTER FORM (CRÉER UN COMPTE) */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                
                {/* Full Name Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom et Prénom / Matricule Usine
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="register-name"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alexandre Martin"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="register-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="a.martin@usine-blady.fr"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rôle Système & Niveau de Droits
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        role === 'admin'
                          ? 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-rose-300">Administrateur</div>
                      <div className="text-[9px] text-slate-400">Gestion des Droits & RBAC</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('supervisor')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        role === 'supervisor'
                          ? 'bg-sky-950/70 border-sky-500 text-sky-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-sky-300">Superviseur</div>
                      <div className="text-[9px] text-slate-400">MES, ERP & Planning</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('operator')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        role === 'operator'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-emerald-300">Opérateur</div>
                      <div className="text-[9px] text-slate-400">Saisie Déclarations L01</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('quality')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        role === 'quality'
                          ? 'bg-purple-950/70 border-purple-500 text-purple-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-purple-300">Qualité</div>
                      <div className="text-[9px] text-slate-400">Lots & Conformité</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('maintenance')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        role === 'maintenance'
                          ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-amber-300">Maintenance</div>
                      <div className="text-[9px] text-slate-400">Interventions & IoT</div>
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mot de passe (6 caractères minimum)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full pl-10 pr-10 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirmez le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="register-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-900/40 border border-sky-400/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Créer mon compte usine</span>
                    </>
                  )}
                </button>

                {/* Link back to Login */}
                <div className="text-center pt-3 border-t border-slate-800/80">
                  <p className="text-xs text-slate-400">
                    Vous possédez déjà des identifiants ?{' '}
                    <button
                      id="link-go-to-login"
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors ml-1"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>

              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Adresse e-mail associée à votre compte
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom.prenom@usine-blady.fr"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-900/40 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Envoyer le lien de réinitialisation</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    &larr; Retour à la page de connexion
                  </button>
                </div>
              </form>
            )}

            {/* SSO Alternative (Google Login) */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="relative flex justify-center text-xs uppercase mb-4">
                <span className="bg-slate-900 px-3 text-slate-500 font-mono text-[10px]">
                  Ou authentification unique usine
                </span>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center space-x-2.5 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continuer avec Google Workspace</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Industrial Footer Note */}
      <div className="mt-8 text-center text-xs text-slate-500 font-mono z-10">
        BladyProduction MES/ERP System v2.4 • Conforme ISA-95 • Authentification Chiffrée TLS / AES-256
      </div>
    </div>
  );
};
