import React, { useState } from 'react';
import { Role } from '../types';
import { LogOut, ArrowRight, Building2, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingViewProps {
  role: Role;
  onJoin: (code: string) => void;
  onCreate: (name: string) => void;
  onLogout: () => void;
}

export function OnboardingView({ role, onJoin, onCreate, onLogout }: OnboardingViewProps) {
  const [code, setCode] = useState('');
  const [companyName, setCompanyName] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 max-w-md mx-auto">
      <div className="absolute top-8 right-8">
        <button id="logout-btn" onClick={onLogout} className="p-3 bg-white text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm border border-slate-100 transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-10"
      >
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 leading-tight">
            {role === 'admin' ? 'Found a Company' : 'Connect Group'}
          </h1>
          <p className="text-slate-400 mt-3 font-medium text-sm">
            {role === 'admin' 
              ? 'Organize your workforce in seconds.' 
              : 'Ask your manager for the unique code.'}
          </p>
        </div>

        {role === 'worker' ? (
          <div className="space-y-6">
            <div className="relative">
              <input
                id="join-code-input"
                type="text"
                placeholder="000 000"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-8 bg-white border-b-8 border-indigo-600 rounded-[2.5rem] text-4xl font-black tracking-[0.2em] text-center shadow-2xl shadow-indigo-100 focus:outline-none placeholder:text-slate-100"
              />
            </div>
            <button
              id="join-confirm-btn"
              disabled={!code}
              onClick={() => onJoin(code)}
              className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-30 flex items-center justify-center gap-3 mt-4"
            >
              JOIN GROUP
              <ArrowRight className="w-8 h-8" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              id="company-name-input"
              type="text"
              placeholder="Business Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-lg font-bold focus:border-indigo-600 focus:outline-none"
            />
            <button
              id="create-company-btn"
              disabled={!companyName}
              onClick={() => onCreate(companyName)}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl shadow-2xl active:scale-95 transition-transform disabled:opacity-30 flex items-center justify-center gap-3 mt-4"
            >
              CREATE COMPANY
              <Building2 className="w-6 h-6" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
