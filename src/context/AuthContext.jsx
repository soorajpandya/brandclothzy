import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref as dbRef, set, get, update } from 'firebase/database';
import { auth, googleProvider, db } from '../firebase';
import { triggerEmail } from '../utils/mailer';

const AuthContext = createContext(null);

function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again in a few minutes.';
    case 'auth/popup-closed-by-user':
      return 'Sign in cancelled. Please try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password provider in your Firebase project.';
    default:
      return null;
  }
}

async function syncUserProfile(user, extra = {}) {
  if (!user?.uid) return;
  try {
    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, {
        uid: user.uid,
        name: extra.name || user.displayName || 'Customer',
        email: user.email || '',
        photo: user.photoURL || null,
        provider: user.providerData?.[0]?.providerId || 'password',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      });

      // Dispatch welcome email on new account registration (Non-blocking)
      if (user.email) {
        triggerEmail({
          to: user.email,
          type: 'welcome',
          name: extra.name || user.displayName || 'Valued Member',
        });
      }
    } else {
      await update(userRef, {
        last_login: new Date().toISOString(),
        ...(extra.name ? { name: extra.name } : {}),
      });
    }
  } catch (err) {
    console.warn('Sync user profile warning:', err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Customer',
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await syncUserProfile(res.user);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error.code) || error.message };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // Always dispatch welcome email immediately upon successful registration
      triggerEmail({
        to: email,
        type: 'welcome',
        name: name || 'Valued Member',
      });

      await syncUserProfile(res.user, { name });
      setUser({
        uid: res.user.uid,
        name: name || 'Customer',
        email: res.user.email,
        photo: null,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error.code) || error.message };
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (res.user) {
        await syncUserProfile(res.user);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error.code) || error.message };
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error.code) || error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

