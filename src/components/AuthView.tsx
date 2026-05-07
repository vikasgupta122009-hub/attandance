import React, { useState } from 'react';
import { UserProfile, Role } from '../types';
import { User as UserIcon, Building2, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthViewProps {
  profile: UserProfile | null;
  onLogin: () => void;
  onSignup: (role: Role, name: string) => void;
}

export function AuthView({ profile, onLogin, onSignup }: AuthViewProps) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');

  if (!profile && !role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-12"
        >
          <div className="text-center">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4 block">Attendance Tracking</span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Universal<br/>Attendance</h1>
            <p className="text-slate-400 mt-4 text-sm font-medium">Simple, reliable, and verified.</p>
          </div>

          <div className="space-y-4">
            <button
              id="login-btn"
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <LogIn className="w-6 h-6" />
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-10"
      >
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Pick your role</h2>
          <p className="text-slate-400 mt-2 font-medium">Almost there.</p>
        </div>

        <div className="space-y-6">
          <input
            id="name-input"
            type="text"
            placeholder="Your Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-lg font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:outline-none transition-colors"
          />

          <div className="grid grid-cols-2 gap-4">
            <button
              id="role-worker-btn"
              onClick={() => setRole('worker')}
              className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-4 transition-all ${
                role === 'worker' 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100' 
                : 'border-white bg-white text-slate-400 opacity-60'
              }`}
            >
              <UserIcon className="w-12 h-12" />
              <span className="font-black text-lg uppercase tracking-tight">Worker</span>
            </button>
            <button
              id="role-admin-btn"
              onClick={() => setRole('admin')}
              className={`p-8 rounded-[2rem] border-4 flex flex-col items-center gap-4 transition-all ${
                role === 'admin' 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100' 
                : 'border-white bg-white text-slate-400 opacity-60'
              }`}
            >
              <Building2 className="w-12 h-12" />
              <span className="font-black text-lg uppercase tracking-tight">Admin</span>
            </button>
          </div>

          <button
            id="finish-signup-btn"
            disabled={!role || !name}
            onClick={() => role && name && onSignup(role, name)}
            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl disabled:opacity-30 disabled:scale-100 active:scale-95 transition-all mt-4"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </motion.div>
    </div>
  );
}
