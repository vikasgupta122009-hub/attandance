import React, { useState, useEffect } from 'react';
import { UserProfile, AttendanceRecord, Message } from '../types';
import { firestoreService } from '../services/firestoreService';
import { 
  Users, 
  QrCode, 
  MessageSquare, 
  Edit3, 
  MapPin, 
  LogOut,
  ChevronRight,
  ExternalLink,
  Send,
  Bell
} from 'lucide-react';
import { formatSafeDate, formatSafeTime } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';

interface AdminViewProps {
  profile: UserProfile;
  onLogout: () => void;
}

export function AdminView({ profile, onLogout }: AdminViewProps) {
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'dashboard' | 'qr' | 'messages' | 'worker-detail'>('dashboard');
  const [selectedWorker, setSelectedWorker] = useState<UserProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [activeWorkerIdForChat, setActiveWorkerIdForChat] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.companyCode) return;

    firestoreService.getWorkersByCompany(profile.companyCode).then(setWorkers);
    
    const unsubAttendance = firestoreService.subscribeToCompanyAttendance(profile.companyCode, (data) => {
      setRecords(data);
    });

    const unsubMessages = firestoreService.subscribeToMessages(profile.companyCode, null, (data) => {
      setMessages(data);
    });

    return () => {
      unsubAttendance();
      unsubMessages();
    };
  }, [profile.companyCode]);

  const toggleAttendance = async (worker: UserProfile, date: string) => {
    const record = records.find(r => r.userId === worker.uid && r.date === date);
    const newStatus = record?.status === 'Present' ? 'Absent' : 'Present';
    
    if (record) {
      await firestoreService.updateAttendanceStatus(record.id, newStatus as any, profile.uid);
    } else {
      // Create new record manually
      await firestoreService.markAttendance({
        userId: worker.uid,
        userName: worker.name,
        companyCode: profile.companyCode!,
        date,
        time: formatSafeTime(new Date()),
        method: 'Admin Override',
        status: newStatus as any,
        editedByAdmin: true
      });
    }
  };

  const sendMessage = async (workerId: string) => {
    if (!messageText.trim() || !profile.companyCode) return;
    await firestoreService.sendMessage({
      senderId: profile.uid,
      senderName: profile.name,
      receiverId: workerId,
      workerId: workerId,
      companyCode: profile.companyCode,
      text: messageText
    });
    setMessageText('');
  };

  const getAttendanceForWorker = (workerId: string) => {
    return records.filter(r => r.userId === workerId);
  };

  const today = formatSafeDate(new Date());

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ADMIN DASHBOARD</span>
          <h1 className="text-xl font-black text-slate-900 leading-tight">{profile.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 tracking-wider">
            {profile.companyCode}
          </div>
          <button id="logout-btn" onClick={onLogout} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest uppercase">Staff Registry ({workers.length})</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold uppercase">active company</span>
              </div>
              <div className="space-y-4">
                {workers.map(worker => {
                  const todayRecord = records.find(r => r.userId === worker.uid && r.date === today);
                  return (
                    <div 
                      key={worker.uid}
                      onClick={() => { setSelectedWorker(worker); setView('worker-detail'); }}
                      className="p-4 bg-white border border-slate-100 rounded-[1.5rem] flex justify-between items-center shadow-sm active:scale-[0.98] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg transition-colors ${todayRecord?.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {worker.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{worker.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${todayRecord ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {todayRecord ? `Marked at ${todayRecord.time}` : 'Unmarked Today'}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
                {workers.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-4 border-dashed border-slate-100">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found.</p>
                    <p className="text-[10px] text-slate-300 mt-2 font-medium">Use code: <span className="font-black text-indigo-600">{profile.companyCode}</span></p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'worker-detail' && selectedWorker && (
            <motion.div 
              key="worker-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <button onClick={() => setView('dashboard')} className="text-indigo-600 font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 mb-4">
                &larr; WORKER DIRECTORY
              </button>
              
              <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-black mb-4 shadow-xl shadow-indigo-100">
                    {selectedWorker.name.charAt(0)}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{selectedWorker.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedWorker.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-[10px] font-black text-emerald-600 mb-1 uppercase tracking-tighter">Verified Days</p>
                    <p className="text-3xl font-black text-emerald-700">{getAttendanceForWorker(selectedWorker.uid).filter(r => r.status === 'Present').length}</p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center">
                    <p className="text-[10px] font-black text-rose-600 mb-1 uppercase tracking-tighter">Absent Days</p>
                    <p className="text-3xl font-black text-rose-700">{getAttendanceForWorker(selectedWorker.uid).filter(r => r.status === 'Absent').length}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Timeline</h4>
                {records.filter(r => r.userId === selectedWorker.uid).map(r => (
                  <div key={r.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.date}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.time} • {r.method}</p>
                      </div>
                      <button 
                        onClick={() => toggleAttendance(selectedWorker, r.date)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest shadow-sm flex items-center gap-2 uppercase transition-all ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {r.status}
                      </button>
                    </div>
                    {r.location && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${r.location.lat},${r.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[9px] font-black tracking-[0.15em] text-indigo-600 bg-indigo-50/50 py-2 px-4 rounded-xl w-fit uppercase"
                      >
                        <MapPin className="w-3 h-3" />
                        View Coordinates
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'qr' && (
            <motion.div 
              key="qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-12 py-10"
            >
              <div className="px-8">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-3 block">Digital Authentication</span>
                <h3 className="text-3xl font-black text-slate-900 leading-none">Shared Access</h3>
                <p className="text-slate-400 mt-4 text-sm font-medium">Position this on your entry point.</p>
              </div>
              
              <div className="bg-slate-900 p-8 rounded-[4rem] shadow-2xl inline-block border-[12px] border-slate-800 mx-auto transform hover:scale-105 transition-transform">
                <div className="bg-white p-6 rounded-[2rem]">
                  <QRCode value={profile.companyCode || ''} size={220} level="H" />
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] mx-8 shadow-sm">
                <p className="text-slate-900 font-black text-3xl tracking-[0.35em] mb-1">{profile.companyCode}</p>
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">Unique Group Token</p>
              </div>
            </motion.div>
          )}

          {view === 'messages' && (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest uppercase">Communication Hub</h3>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold uppercase">all channels</span>
              </div>
              
              {activeWorkerIdForChat ? (
                <div className="flex flex-col h-[65vh]">
                  <button onClick={() => setActiveWorkerIdForChat(null)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                    &larr; BACK TO INBOX
                  </button>
                  <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 overflow-y-auto space-y-4 mb-4 shadow-inner">
                    {messages.filter(m => m.workerId === activeWorkerIdForChat).map((m) => (
                      <div key={m.id} className={`flex ${m.senderId === profile.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                          m.senderId === profile.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-900 rounded-bl-none'
                        }`}>
                          <p className="text-[10px] font-black uppercase tracking-tighter opacity-40 mb-1">
                            {m.senderId === profile.uid ? 'You' : m.senderName}
                          </p>
                          <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                          <p className="text-[10px] mt-2 opacity-30 text-right font-bold">{formatSafeTime(new Date(m.timestamp)).slice(0, 5)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-xl">
                    <input
                      id="admin-msg-input"
                      type="text"
                      placeholder="Type reply..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 px-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-slate-200"
                    />
                    <button 
                      onClick={() => sendMessage(activeWorkerIdForChat)}
                      className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(new Set(messages.map(m => m.workerId))).map(workerId => {
                    const lastMsg = messages.filter(m => m.workerId === workerId).slice(-1)[0];
                    const worker = workers.find(w => w.uid === workerId);
                    return (
                      <div 
                        key={workerId}
                        onClick={() => setActiveWorkerIdForChat(workerId)}
                        className="p-5 bg-white border border-slate-100 rounded-[1.5rem] flex justify-between items-center cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600 text-xl shadow-inner">
                             {worker?.name.charAt(0) || '?'}
                          </div>
                          <div className="max-w-[180px]">
                            <p className="font-black text-slate-900 text-sm">{worker?.name || 'Worker'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-wider">{lastMsg.text}</p>
                          </div>
                        </div>
                        <div className="bg-indigo-600 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_indigo]" />
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100">
                       <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Inbox is empty</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="fixed bottom-8 left-6 right-6 h-20 bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl z-20">
        <button 
          onClick={() => setView('dashboard')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${view === 'dashboard' || view === 'worker-detail' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <Users className="w-6 h-6" strokeWidth={view === 'dashboard' || view === 'worker-detail' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Board</span>
        </button>
        <button 
          onClick={() => setView('qr')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${view === 'qr' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <QrCode className="w-6 h-6" strokeWidth={view === 'qr' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Access</span>
        </button>
        <button 
          onClick={() => { setView('messages'); setActiveWorkerIdForChat(null); }} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${view === 'messages' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <div className="relative">
             <MessageSquare className="w-6 h-6" strokeWidth={view === 'messages' ? 3 : 2} />
             {messages.length > 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Inbox</span>
        </button>
      </div>
    </div>
  );
}
