import React, { useState, useEffect } from 'react';
import { UserProfile, AttendanceRecord, AttendanceStatus, Message } from '../types';
import { firestoreService } from '../services/firestoreService';
import { 
  CheckCircle2, 
  Camera, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  MapPin, 
  LogOut,
  Send,
  Bell
} from 'lucide-react';
import { formatSafeDate, formatSafeTime } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import QrScanner from 'react-qr-scanner';

interface WorkerViewProps {
  profile: UserProfile;
  onLogout: () => void;
}

export function WorkerView({ profile, onLogout }: WorkerViewProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'home' | 'history' | 'messages'>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile.companyCode) return;
    
    // Subscribe to attendance
    const unsubAttendance = firestoreService.subscribeToWorkerAttendance(profile.uid, (data) => {
      setRecords(data);
    });

    // Subscribe to messages
    const unsubMessages = firestoreService.subscribeToMessages(profile.companyCode, profile.uid, (data) => {
      setMessages(data);
    });

    return () => {
      unsubAttendance();
      unsubMessages();
    };
  }, [profile.uid, profile.companyCode]);

  const markAttendance = async (method: 'Button' | 'QR') => {
    setLoading(true);
    try {
      let location = undefined;
      
      // Get GPS - only triggered when clicking
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (err) {
        console.warn("GPS failed", err);
      }

      const now = new Date();
      await firestoreService.markAttendance({
        userId: profile.uid,
        userName: profile.name,
        companyCode: profile.companyCode!,
        date: formatSafeDate(now),
        time: formatSafeTime(now),
        location,
        method,
        status: 'Present'
      });
      alert("Attendance marked!");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setShowScanner(false);
    }
  };

  const handleScan = (data: any) => {
    if (data && data.text === profile.companyCode) {
      markAttendance('QR');
    } else if (data) {
      alert("Invalid QR Code for this company.");
      setShowScanner(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !profile.companyCode) return;
    await firestoreService.sendMessage({
      senderId: profile.uid,
      senderName: profile.name,
      receiverId: 'admin', // In this simple app, we can route to admin group or specific ID
      workerId: profile.uid,
      companyCode: profile.companyCode,
      text: messageText
    });
    setMessageText('');
  };

  const todayRecord = records.find(r => r.date === formatSafeDate(new Date()));

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.role} VIEW</span>
          <h1 className="text-xl font-black text-slate-900 leading-tight">{profile.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold italic shadow-sm">
            {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <button id="logout-btn" onClick={onLogout} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className={`p-8 rounded-[2rem] text-center shadow-2xl ${todayRecord ? 'bg-emerald-50 text-emerald-700 shadow-emerald-100' : 'bg-rose-50 text-rose-700 shadow-rose-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{todayRecord ? 'STATUS: PRESENT' : 'STATUS: ABSENT'}</p>
                <h2 className="text-4xl font-black mt-2 tracking-tight">{todayRecord ? 'Verified' : 'Unmarked'}</h2>
                {todayRecord?.time && <p className="mt-2 font-mono text-xs font-bold opacity-40">{todayRecord.time}</p>}
                {todayRecord?.editedByAdmin && (
                  <div className="mt-4 flex items-center justify-center gap-2 bg-white/60 py-2 px-4 rounded-full text-[10px] font-black tracking-widest ring-1 ring-emerald-600/10 uppercase">
                    <Bell className="w-3 h-3" />
                    Updated by Admin
                  </div>
                )}
              </div>

              {!todayRecord && (
                <div className="grid grid-cols-1 gap-5">
                  <button
                    id="mark-present-btn"
                    disabled={loading}
                    onClick={() => markAttendance('Button')}
                    className="w-full h-28 bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-8 h-8" strokeWidth={3} />
                    <span className="text-lg font-black uppercase tracking-tight">MARK PRESENT</span>
                  </button>

                  <button
                    id="scan-qr-btn"
                    disabled={loading}
                    onClick={() => setShowScanner(true)}
                    className="w-full h-28 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Camera className="w-8 h-8" strokeWidth={3} />
                    <span className="text-lg font-black uppercase tracking-tight">SCAN ADMIN QR</span>
                  </button>
                </div>
              )}

              {showScanner && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
                  <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gray-900 ring-4 ring-white/20 relative">
                    {/* Simplified QR Scanner UI */}
                    <div className="absolute inset-0 flex items-center justify-center text-white text-center p-12">
                      <p className="font-bold">Point camera at Admin's QR Code</p>
                    </div>
                    {/* Placeholder for scanner if library fails in iframe */}
                    <QrScanner
                      onScan={(result: any) => handleScan(result)}
                      onError={(err: any) => console.error(err)}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  <button onClick={() => setShowScanner(false)} className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold">
                    CANCEL
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Attendance History</h3>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold uppercase">verified log</span>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="grid grid-cols-7 gap-3">
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-slate-300 py-1">{d}</div>
                  ))}
                  {eachDayOfInterval({
                    start: startOfMonth(new Date()),
                    end: endOfMonth(new Date())
                  }).map((day, i) => {
                    const record = records.find(r => isSameDay(new Date(r.date), day));
                    const isToday = isSameDay(day, new Date());
                    const isPast = day < new Date() && !isToday;
                    
                    let style = 'bg-slate-50 border-transparent';
                    if (record?.status === 'Present') style = 'bg-emerald-100 border-emerald-500 text-emerald-700';
                    else if (record?.status === 'Absent' || (isPast && !record)) style = 'bg-rose-100 border-rose-500 text-rose-700';

                    return (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black shadow-sm border-2 transition-all relative ${style} ${isToday ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}`}
                      >
                        {format(day, 'd')}
                        {record?.editedByAdmin && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-3 pt-6">
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Latest Entries</p>
                {records.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{format(new Date(r.date), 'EEEE, MMM d')}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{r.time} • {r.method}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${r.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {r.status}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'messages' && (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-[70vh]"
            >
              <h3 className="text-2xl font-black mb-4">MESSAGE ADMIN</h3>
              <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-6 overflow-y-auto space-y-4 mb-4 shadow-inner">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-300 text-sm font-bold uppercase tracking-widest text-center px-12">
                    No conversation started.
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === profile.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${
                      m.senderId === profile.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-900 rounded-bl-none'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                      <p className="text-[10px] mt-2 opacity-40 font-bold uppercase tracking-tighter">
                        {m.senderId === profile.uid ? 'Me' : 'Admin'} • {formatSafeTime(new Date(m.timestamp)).slice(0, 5)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-xl">
                <input
                  id="message-input"
                  type="text"
                  placeholder="Message Admin..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-slate-200"
                />
                <button 
                  id="send-message-btn"
                  onClick={sendMessage}
                  className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="fixed bottom-8 left-6 right-6 h-20 bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl z-20">
        <button 
          onClick={() => setView('home')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${view === 'home' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <CheckCircle2 className="w-6 h-6" strokeWidth={view === 'home' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Mark</span>
        </button>
        <button 
          onClick={() => setView('history')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${view === 'history' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <CalendarIcon className="w-6 h-6" strokeWidth={view === 'history' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Logs</span>
        </button>
        <button 
          onClick={() => setView('messages')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${view === 'messages' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" strokeWidth={view === 'messages' ? 3 : 2} />
            {messages.length > 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Mail</span>
        </button>
      </div>
    </div>
  );
}
