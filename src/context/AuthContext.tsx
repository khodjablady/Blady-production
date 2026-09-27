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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'operator' | 'supervisor' | 'admin';
  createdAt: string;
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
      return "L'authentification par e-mail et mot de passe n'est pas encore activée dans la console Firebase. Vous pouvez vous connecter via Google ou utiliser l'accès Démo instantané.";
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
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role?: 'operator' | 'supervisor' | 'admin') => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithDemo: (role?: 'operator' | 'supervisor' | 'admin', name?: string, email?: string) => void;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [demoUser, setDemoUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  useEffect(() => {
    // Initial connection test as required by firebase-integration skill
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
            setProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Opérateur MES',
              role: 'supervisor',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('[Auth] Failed to sync user profile:', err);
          // Fallback profile
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Opérateur MES',
            role: 'supervisor',
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
    role: 'operator' | 'supervisor' | 'admin' = 'supervisor'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const cleanedName = displayName.trim() || 'Opérateur MES';
    
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
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (err) {
      console.warn('[Auth] Failed to save profile to Firestore:', err);
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
    role: 'operator' | 'supervisor' | 'admin' = 'supervisor',
    name: string = 'Superviseur de Production',
    email: string = 'superviseur@bladyproduction.fr'
  ) => {
    const simulatedUser: AppUser = {
      uid: `demo-${role}-${Date.now()}`,
      email: email,
      displayName: name,
      photoURL: null,
      isDemo: true
    };
    const simulatedProfile: UserProfile = {
      uid: simulatedUser.uid,
      email: simulatedUser.email || '',
      displayName: simulatedUser.displayName || 'Utilisateur Démo',
      role: role,
      createdAt: new Date().toISOString()
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
      loginWithEmail, 
      registerWithEmail, 
      loginWithGoogle, 
      loginWithDemo, 
      resetPassword, 
      logout 
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
