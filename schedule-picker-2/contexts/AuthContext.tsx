'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  OAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export type UserPlan = 'free' | 'premium' | 'admin';

interface UserData {
  email: string;
  displayName: string;
  plan: UserPlan;
  stripeCustomerId?: string;
  monthlyUsage: number;
  usageResetDate: string;
  calendarAccessToken?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  calendarAccessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarAccessToken, setCalendarAccessToken] = useState<string | null>(null);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());

  async function fetchUserData(u: User) {
    const userRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserData;
      // 月初リセットチェック
      const now = new Date();
      const resetDate = new Date(data.usageResetDate);
      if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        const updated = { ...data, monthlyUsage: 0, usageResetDate: now.toISOString() };
        await setDoc(userRef, updated, { merge: true });
        setUserData(updated);
      } else {
        setUserData(data);
      }
    } else {
      // 新規ユーザー作成
      const isAdmin = adminEmails.includes(u.email || '');
      const newUser: UserData = {
        email: u.email || '',
        displayName: u.displayName || '',
        plan: isAdmin ? 'admin' : 'free',
        monthlyUsage: 0,
        usageResetDate: new Date().toISOString(),
      };
      await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
      setUserData(newUser);
    }
  }

  async function signIn() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Calendar APIのアクセストークンを保存
      const credential = OAuthProvider.credentialFromResult(result);
      if (credential && 'accessToken' in credential) {
        setCalendarAccessToken((credential as any).accessToken || null);
      }
      // Google OAuthのアクセストークンを取得
      const oauthCredential = (result as any)._tokenResponse;
      if (oauthCredential?.oauthAccessToken) {
        setCalendarAccessToken(oauthCredential.oauthAccessToken);
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Sign in error:', error);
      }
    }
  }

  async function signOutUser() {
    await signOut(auth);
    setCalendarAccessToken(null);
  }

  async function refreshUserData() {
    if (user) {
      await fetchUserData(user);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchUserData(u);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signOutUser, refreshUserData, calendarAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
