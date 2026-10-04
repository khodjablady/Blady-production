import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleAuthProvider, db, testFirestoreConnection } from '../lib/firebase';
import { UserAccount, UserRole, ModulePermissionMap } from '../types';
import { INITIAL_USERS, DEFAULT_ROLE_PERMISSIONS } from '../data/rbacData';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  jobTitle?: string;
  modulePermissions?: ModulePermissionMap;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

export function getFirebaseAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'E-mail ou mot de passe incorrect. Veuillez vérifier vos identifiants.';
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cette adresse e-mail. Cliquez sur "Créer un compte" pour vous inscrire.';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée par un autre compte.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/invalid-email':
      return "L'adresse e-mail saisie est invalide.";
    case 'auth/operation-not-allowed':
      return "L'authentification par e-mail et mot de passe n'est pas encore activée dans la console Firebase. Vous pouvez vous connecter via Google ou utiliser l'accès Administrateur / Démo instantané.";
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter quelques instants avant de réessayer.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée.';
    default:
      return error?.message || 'Une erreur est survenue lors de l\'authentification.';
  }
}

interface AuthContextType {
  user: FirebaseUser | AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  dbConnected: boolean;
  usersList: UserAccount[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithDemo: (role?: UserRole, name?: string, email?: string) => void;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserAccount: (updated: UserAccount) => void;
  createUserAccount: (newUser: UserAccount) => void;
  deleteUserAccount: (uid: string) => void;
  switchUserAccount: (account: UserAccount) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [demoUser, setDemoUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // RBAC Users Directory
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('blady_rbac_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure canonical admin user is synced to Zahir KHODJA / infos@blady-product.com
          return parsed.map((u: UserAccount) => {
            if (u.uid === 'user-admin-01' || u.role === 'admin' || u.email === 'admin@khodja-co.com') {
              return {
                ...u,
                displayName: 'Zahir KHODJA',
                email: 'infos@blady-product.com',
                jobTitle: 'Directeur Général & Administrateur Système'
              };
            }
            return u;
          });
        }
      } catch (e) {
        console.warn('Failed to parse stored users:', e);
      }
    }
    return INITIAL_USERS;
  });

  // Persist users list changes
  const saveUsersList = (newUsers: UserAccount[]) => {
    setUsersList(newUsers);
    localStorage.setItem('blady_rbac_users', JSON.stringify(newUsers));
  };

  const updateUserAccount = (updated: UserAccount) => {
    const newUsers = usersList.map((u) => (u.uid === updated.uid ? updated : u));
    saveUsersList(newUsers);

    // If currently logged in as this user, update active profile
    if (profile && (profile.uid === updated.uid || profile.email === updated.email)) {
      const updatedProfile: UserProfile = {
        ...profile,
        displayName: updated.displayName,
        role: updated.role,
        jobTitle: updated.jobTitle,
        modulePermissions: updated.modulePermissions
      };
      setProfile(updatedProfile);
      if (demoUser) {
        localStorage.setItem('blady_demo_session', JSON.stringify({ user: demoUser, profile: updatedProfile }));
      }
    }
  };

  const createUserAccount = (newUser: UserAccount) => {
    const newUsers = [newUser, ...usersList];
    saveUsersList(newUsers);
  };

  const deleteUserAccount = (uid: string) => {
    const newUsers = usersList.filter((u) => u.uid !== uid);
    saveUsersList(newUsers);
  };

  const switchUserAccount = (account: UserAccount) => {
    const simulatedUser: AppUser = {
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      photoURL: null,
      isDemo: true
    };
    const simulatedProfile: UserProfile = {
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      jobTitle: account.jobTitle,
      createdAt: account.createdAt,
      modulePermissions: account.modulePermissions
    };

    localStorage.setItem('blady_demo_session', JSON.stringify({ user: simulatedUser, profile: simulatedProfile }));
    setDemoUser(simulatedUser);
    setProfile(simulatedProfile);
  };

  useEffect(() => {
    // Initial connection test
    testFirestoreConnection().then(connected => {
      setDbConnected(connected);
    });

    // Check stored demo session
    const storedDemo = localStorage.getItem('blady_demo_session');
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        if (parsed?.user && parsed?.profile) {
          setDemoUser(parsed.user);
          setProfile(parsed.profile);
        }
      } catch (e) {
        localStorage.removeItem('blady_demo_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        // Clear demo state if real user is logged in
        setDemoUser(null);
        localStorage.removeItem('blady_demo_session');

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            const role = (data.role as UserRole) || (currentUser.email?.includes('admin') ? 'admin' : 'supervisor');
            const userProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: data.displayName || currentUser.displayName || 'Utilisateur MES',
              role: role,
              jobTitle: data.jobTitle,
              modulePermissions: data.modulePermissions || DEFAULT_ROLE_PERMISSIONS[role],
              createdAt: data.createdAt || new Date().toISOString()
            };
            setProfile(userProfile);
          } else {
            // First time login for this real Firebase user
            const isAdmin = currentUser.email?.includes('admin') || currentUser.email === 'infos@blady-product.com';
            const initialRole: UserRole = isAdmin ? 'admin' : 'supervisor';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || (isAdmin ? 'Zahir KHODJA' : 'Opérateur MES'),
              role: initialRole,
              jobTitle: isAdmin ? 'Directeur Général & Administrateur Système' : 'Superviseur MES',
              modulePermissions: DEFAULT_ROLE_PERMISSIONS[initialRole],
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('[Auth] Failed to sync user profile:', err);
          const isAdmin = currentUser.email?.includes('admin') || currentUser.email === 'infos@blady-product.com';
          const fallbackRole: UserRole = isAdmin ? 'admin' : 'supervisor';
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || (isAdmin ? 'Zahir KHODJA' : 'Opérateur MES'),
            role: fallbackRole,
            jobTitle: isAdmin ? 'Directeur Général & Administrateur Système' : 'Superviseur MES',
            modulePermissions: DEFAULT_ROLE_PERMISSIONS[fallbackRole],
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // If not a demo user, clear profile
        if (!demoUser && !localStorage.getItem('blady_demo_session')) {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    setFirebaseUser(cred.user);
    setDemoUser(null);
    localStorage.removeItem('blady_demo_session');
  };

  const registerWithEmail = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole = 'supervisor'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const cleanedName = displayName.trim() || (role === 'admin' ? 'Zahir KHODJA' : 'Opérateur MES');
    
    try {
      await updateProfile(cred.user, { displayName: cleanedName });
    } catch (err) {
      console.warn('[Auth] Failed to update displayName in auth profile:', err);
    }

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email.trim(),
      displayName: cleanedName,
      role: role,
      jobTitle: role === 'admin' ? 'Directeur Général & Administrateur Système' : 'Collaborateur Usine',
      modulePermissions: DEFAULT_ROLE_PERMISSIONS[role],
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (err) {
      console.warn('[Auth] Failed to save profile to Firestore:', err);
    }

    // Also add to local directory list if not already there
    const newUserAccount: UserAccount = {
      uid: cred.user.uid,
      email: newProfile.email,
      displayName: newProfile.displayName,
      role: newProfile.role,
      active: true,
      jobTitle: newProfile.jobTitle,
      createdAt: newProfile.createdAt,
      modulePermissions: newProfile.modulePermissions || DEFAULT_ROLE_PERMISSIONS[role]
    };
    if (!usersList.some((u) => u.email.toLowerCase() === newProfile.email.toLowerCase())) {
      saveUsersList([newUserAccount, ...usersList]);
    }

    setProfile(newProfile);
    setFirebaseUser(cred.user);
    setDemoUser(null);
    localStorage.removeItem('blady_demo_session');
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    setFirebaseUser(cred.user);
    setDemoUser(null);
    localStorage.removeItem('blady_demo_session');
  };

  const loginWithDemo = (
    role: UserRole = 'admin',
    name?: string,
    email?: string
  ) => {
    // If admin is requested, pick the canonical admin account
    let finalName = name;
    let finalEmail = email;
    let jobTitle = 'Collaborateur Usine';

    if (role === 'admin') {
      finalName = finalName || 'Zahir KHODJA (Directeur Général & Administrateur Système)';
      finalEmail = finalEmail || 'infos@blady-product.com';
      jobTitle = 'Directeur Général & Administrateur Système';
    } else if (role === 'supervisor') {
      finalName = finalName || 'Jean Dupont (Superviseur)';
      finalEmail = finalEmail || 'superviseur@usine-blady.fr';
      jobTitle = 'Chef d’Atelier & Superviseur MES';
    } else if (role === 'operator') {
      finalName = finalName || 'Marc Vallet (Opérateur)';
      finalEmail = finalEmail || 'operateur@usine-blady.fr';
      jobTitle = 'Conducteur de Ligne 01';
    } else if (role === 'quality') {
      finalName = finalName || 'Sarah Benali (Qualité)';
      finalEmail = finalEmail || 'qualite@khodja-co.com';
      jobTitle = 'Responsable Assurance Qualité';
    } else if (role === 'maintenance') {
      finalName = finalName || 'Karim Meziane (Maintenance)';
      finalEmail = finalEmail || 'maintenance@khodja-co.com';
      jobTitle = 'Technicien Supérieur Maintenance';
    }

    const permissions = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.admin;

    const simulatedUser: AppUser = {
      uid: role === 'admin' ? 'user-admin-01' : `demo-${role}-${Date.now()}`,
      email: finalEmail || (role === 'admin' ? 'infos@blady-product.com' : 'admin@khodja-co.com'),
      displayName: finalName || (role === 'admin' ? 'Zahir KHODJA' : 'Utilisateur'),
      photoURL: null,
      isDemo: true
    };
    const simulatedProfile: UserProfile = {
      uid: simulatedUser.uid,
      email: simulatedUser.email || '',
      displayName: simulatedUser.displayName || (role === 'admin' ? 'Zahir KHODJA' : 'Utilisateur'),
      role: role,
      jobTitle: jobTitle,
      createdAt: new Date().toISOString(),
      modulePermissions: permissions
    };

    localStorage.setItem('blady_demo_session', JSON.stringify({ user: simulatedUser, profile: simulatedProfile }));
    setDemoUser(simulatedUser);
    setProfile(simulatedProfile);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    localStorage.removeItem('blady_demo_session');
    setDemoUser(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[Auth] Sign-Out error:', err);
    }
  };

  const effectiveUser = firebaseUser || demoUser;

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser, 
      profile, 
      loading, 
      dbConnected, 
      usersList,
      loginWithEmail, 
      registerWithEmail, 
      loginWithGoogle, 
      loginWithDemo, 
      resetPassword, 
      logout,
      updateUserAccount,
      createUserAccount,
      deleteUserAccount,
      switchUserAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
