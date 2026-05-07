import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { firestoreService } from './services/firestoreService';
import { UserProfile, Role, Company } from './types';
import { AuthView } from './components/AuthView';
import { OnboardingView } from './components/OnboardingView';
import { WorkerView } from './components/WorkerView';
import { AdminView } from './components/AdminView';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userProfile = await firestoreService.getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignup = async (role: Role, name: string) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email || '',
      role,
      createdAt: new Date().toISOString(),
    };
    await firestoreService.createUserProfile(newProfile);
    setProfile(newProfile);
  };

  const handleJoinCompany = async (code: string) => {
    if (!profile) return;
    const company = await firestoreService.getCompany(code);
    if (company) {
      await firestoreService.joinCompany(profile.uid, code);
      setProfile({ ...profile, companyCode: code });
    } else {
      alert("Invalid Company Code");
    }
  };

  const handleCreateCompany = async (name: string) => {
    if (!profile) return;
    // Generate a simple unique code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await firestoreService.createCompany({
      code,
      name,
      adminUid: profile.uid,
      createdAt: new Date().toISOString(),
    });
    setProfile({ ...profile, companyCode: code });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={loginWithGoogle} profile={null} onSignup={() => {}} />;
  }

  if (!profile) {
    return <AuthView onLogin={loginWithGoogle} profile={null} onSignup={handleSignup} />;
  }

  if (!profile.companyCode) {
    return <OnboardingView 
      role={profile.role} 
      onJoin={handleJoinCompany} 
      onCreate={handleCreateCompany} 
      onLogout={logout}
    />;
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative shadow-2xl border-x border-slate-100">
      {profile.role === 'worker' ? (
        <WorkerView profile={profile} onLogout={logout} />
      ) : (
        <AdminView profile={profile} onLogout={logout} />
      )}
    </div>
  );
}
