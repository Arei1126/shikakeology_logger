import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Play, Square, RotateCcw, Settings, FileText, Trash2, Eye, Footprints, Hand, User, Moon, Sun, Smartphone, Archive, History, CheckCircle, X, Users, Edit3, Volume2, VolumeX, Save } from 'lucide-react';

/**
 * Shikakeology Action Logger (PWA-ready) v4.0
 * 仕掛学に基づく行動観察用ロガー
 * * Update v4.0:
 * - 個人/集団 (Individual/Group) の記録に対応（UIを4分割化）
 * - 直近の記録の編集・削除機能（モーダル）を追加
 * - 個人単位のメモ機能を追加
 * - Web Audio APIによる操作音フィードバック
 * - CSV出力にグループ属性とメモ列を追加
 */

// --- Type Definitions ---

type ActionType = 'Pass' | 'Look' | 'Stop' | 'Use';
type Gender = 'Male' | 'Female';

interface LogEntry {
  id: string;
  timestamp: string; // ISO String
  unixTime: number;
  gender: Gender;
  isGroup: boolean; // Added v4.0
  action: ActionType;
  note: string;     // Added v4.0
  // Shikakeology Logic Flags
  isPass: boolean;
  isLook: boolean;
  isStop: boolean;
  isUse: boolean;
}

interface SessionInfo {
  startTime: number | null;
  endTime: number | null;
  note: string;
  location: string;
}

interface ArchivedSession {
  id: string;
  date: string; // Save Date
  sessionInfo: SessionInfo;
  logs: LogEntry[];
}

interface AppSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean; // Added v4.0
  darkMode: boolean;
}

// --- Configuration ---

const ACTION_CONFIG = {
  Pass: { label: '通行 (Pass)', color: 'bg-slate-400 dark:bg-slate-600', ringColor: '#94a3b8', icon: <User size={24} /> },
  Look: { label: '見た (Look)', color: 'bg-amber-500', ringColor: '#f59e0b', icon: <Eye size={24} /> },
  Stop: { label: '止まった (Stop)', color: 'bg-emerald-600', ringColor: '#059669', icon: <Footprints size={24} /> },
  Use:  { label: '使った (Use)', color: 'bg-pink-600', ringColor: '#db2777', icon: <Hand size={24} /> },
};

// --- Audio Helper ---
const playTone = (type: 'record' | 'delete' | 'success') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'record') {
            // Short high pitch "Pop"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'delete') {
            // Low pitch "Bum"
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'success') {
            // Rising chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export default function App() {
  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  
  // Modes
  const [isSetupMode, setIsSetupMode] = useState(false); 
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Edit Modal State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    startTime: null,
    endTime: null,
    note: '',
    location: '',
  });
  const [history, setHistory] = useState<ArchivedSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    hapticsEnabled: true,
    soundEnabled: true,
    darkMode: false,
  });
  
  // Touch Interaction State
  const [activeTouch, setActiveTouch] = useState<{
    id: number;
    gender: Gender;
    isGroup: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    selectedAction: ActionType;
  } | null>(null);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('shikake_logs');
      const savedSession = localStorage.getItem('shikake_session');
      const savedIsRecording = localStorage.getItem('shikake_is_recording');
      const savedHistory = localStorage.getItem('shikake_history');
      const savedSettings = localStorage.getItem('shikake_settings');

      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedSession) setSessionInfo(JSON.parse(savedSession));
      if (savedIsRecording) setIsRecording(false); // Resume paused
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('shikake_logs', JSON.stringify(logs));
    localStorage.setItem('shikake_session', JSON.stringify(sessionInfo));
    localStorage.setItem('shikake_is_recording', JSON.stringify(isRecording));
    localStorage.setItem('shikake_history', JSON.stringify(history));
    localStorage.setItem('shikake_settings', JSON.stringify(settings));
    
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [logs, sessionInfo, isRecording, history, settings]);

  useEffect(() => {
    // Only scroll to bottom if NOT editing
    if (!editingLogId) {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, editingLogId]);

  // --- Helper: Feedback ---

  const triggerFeedback = (type: 'record' | 'delete' | 'success', hapticPattern?: number | number[]) => {
    if (settings.hapticsEnabled && hapticPattern) {
        try { navigator.vibrate?.(hapticPattern); } catch(e){}
    }
    if (settings.soundEnabled) {
        playTone(type);
    }
  };

  // --- Logic: Session & Recording ---

  const initSession = () => { setIsSetupMode(true); setIsFinishing(false); };

  const startRecording = () => {
    const now = Date.now();
    if (!sessionInfo.startTime) setSessionInfo(prev => ({ ...prev, startTime: now, endTime: null }));
    else setSessionInfo(prev => ({ ...prev, endTime: null }));
    
    setIsSetupMode(false);
    setIsRecording(true);
    triggerFeedback('success', 100);
  };

  const stopSession = () => {
    if (!isRecording) return;
    setSessionInfo(prev => ({ ...prev, endTime: Date.now() }));
    setIsRecording(false);
    setIsFinishing(true); 
    triggerFeedback('success', [50, 50, 50]);
  };

  const addLog = (gender: Gender, isGroup: boolean, action: ActionType) => {
    if (!isRecording) return;
    triggerFeedback('record', 50);

    const now = new Date();
    // Hierarchical Logic
    const isUse = action === 'Use';
    const isStop = action === 'Stop' || isUse;
    const isLook = action === 'Look' || isStop;
    const isPass = true; 

    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      unixTime: now.getTime(),
      gender,
      isGroup,
      action,
      note: '',
      isPass, isLook, isStop, isUse,
    };

    setLogs(prev => [...prev, newLog]);
  };

  const undoLastLog = () => {
    setLogs(prev => prev.slice(0, -1));
    triggerFeedback('delete', 30);
  };

  // --- Logic: Edit & Update ---

  const updateLog = (id: string, updates: Partial<LogEntry>) => {
      setLogs(prev => prev.map(log => {
          if (log.id !== id) return log;
          
          // Re-calculate hierarchical flags if action changed
          let newFlags = {};
          if (updates.action) {
              const act = updates.action;
              const isUse = act === 'Use';
              newFlags = {
                  isPass: true,
                  isLook: act === 'Look' || act === 'Stop' || isUse,
                  isStop: act === 'Stop' || isUse,
                  isUse: isUse
              };
          }
          return { ...log, ...updates, ...newFlags };
      }));
  };

  const deleteLog = (id: string) => {
      if(window.confirm('この記録を削除しますか？')) {
          setLogs(prev => prev.filter(l => l.id !== id));
          setEditingLogId(null);
          triggerFeedback('delete', 50);
      }
  };

  // --- Logic: Archive ---

  const archiveAndResetSession = () => {
    if (logs.length === 0) {
      alert('保存するデータがありません。');
      setIsFinishing(false);
      return;
    }
    const newArchive: ArchivedSession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        sessionInfo: { ...sessionInfo, endTime: sessionInfo.endTime || Date.now() },
        logs: [...logs]
    };
    setHistory(prev => [newArchive, ...prev]);
    setLogs([]);
    setSessionInfo({ startTime: null, endTime: null, note: '', location: '' });
    setIsFinishing(false);
    triggerFeedback('success', [50, 100]);
    alert('セッションを保存しました！');
  };

  const deleteHistoryItem = (id: string) => {
      if(window.confirm('履歴を削除しますか？')) setHistory(prev => prev.filter(item => item.id !== id));
  };

  // --- Logic: CSV Export ---

  const generateCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo) => {
    const headers = [
        'ID', 'Timestamp_ISO', 'Timestamp_JST', 'UnixTime', 
        'Gender', 'Action_Raw', 'isGroup', // Added isGroup
        'isMale', 'isFemale', 'isGroup_Dummy', // Dummy vars
        'Passing(0)', 'Look(1)', 'Stop(2)', 'Use(3)',
        'Note' // Added Note
    ];
    
    const rows = targetLogs.map(log => {
        const jstDate = new Date(log.unixTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        return [
            log.id,
            log.timestamp,
            jstDate, 
            log.unixTime,
            log.gender,
            log.action,
            log.isGroup ? 'Group' : 'Individual',
            log.gender === 'Male' ? '1' : '0',
            log.gender === 'Female' ? '1' : '0',
            log.isGroup ? '1' : '0',
            log.isPass ? '1' : '0',
            log.isLook ? '1' : '0',
            log.isStop ? '1' : '0',
            log.isUse ? '1' : '0',
            `"${(log.note || '').replace(/"/g, '""')}"` // Escape quotes in note
        ];
    });

    const startTimeStr = targetInfo.startTime ? new Date(targetInfo.startTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
    const endTimeStr = targetInfo.endTime ? new Date(targetInfo.endTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
    const sanitizedNote = (targetInfo.note || '').replace(/[\n\r,]/g, ' ');

    return [
      `# Shikakeology Data Export (v4.0)`,
      `# Export Date,${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      `# Session Start,${startTimeStr}`,
      `# Session End,${endTimeStr}`,
      `# Location,${targetInfo.location}`,
      `# Note,${sanitizedNote}`,
      `# Total Records,${targetLogs.length}`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
  };

  const downloadCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo, prefix: string) => {
    if (targetLogs.length === 0) { alert('No Data'); return; }
    const csvContent = generateCSV(targetLogs, targetInfo);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${prefix}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Logic: Touch Gesture ---

  const determineAction = (dx: number, dy: number, gender: Gender): ActionType => {
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 50) return 'Pass';
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Up: Look (225-315) | Down: Use (45-135)
    if (angle >= 225 && angle < 315) return 'Look';
    if (angle >= 45 && angle < 135) return 'Use';
    
    // Side: Stop (Male: Right, Female: Left)
    if (gender === 'Male') {
       if (angle >= 315 || angle < 45) return 'Stop';
    } else {
       if (angle >= 135 && angle < 225) return 'Stop';
    }
    return 'Pass';
  };

  const handleTouchStart = (e: React.TouchEvent, gender: Gender, isGroup: boolean) => {
    if (!isRecording) return;
    const touch = e.changedTouches[0];
    setActiveTouch({
      id: touch.identifier,
      gender,
      isGroup,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      selectedAction: 'Pass',
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeTouch) return;
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouch.id);
    if (!touch) return;
    
    const dx = touch.clientX - activeTouch.startX;
    const dy = touch.clientY - activeTouch.startY;
    const newAction = determineAction(dx, dy, activeTouch.gender);

    if (newAction !== activeTouch.selectedAction) {
       triggerFeedback('record', 15);
    }
    setActiveTouch(prev => prev ? { ...prev, currentX: touch.clientX, currentY: touch.clientY, selectedAction: newAction } : null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!activeTouch) return;
    addLog(activeTouch.gender, activeTouch.isGroup, activeTouch.selectedAction);
    setActiveTouch(null);
  };

  // --- Components ---

  const StaticGuide = ({ gender, isGroup }: { gender: Gender, isGroup: boolean }) => {
      const isMale = gender === 'Male';
      const labelColor = isMale ? 'text-blue-100' : 'text-rose-100';
      const icon = isGroup ? <Users size={32} /> : <User size={32} />;
      
      return (
          <div className={`absolute pointer-events-none flex flex-col items-center justify-center opacity-60 scale-75`}>
              <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center mb-2
                  ${isMale 
                      ? 'border-blue-300/30 bg-blue-800/20 dark:border-blue-400/30 dark:bg-blue-900/40' 
                      : 'border-rose-300/30 bg-rose-800/20 dark:border-rose-400/30 dark:bg-rose-900/40'
                  }`}
              >
                 <div className={`${labelColor} opacity-80 mb-1`}>{icon}</div>
                 <div className={`text-xs font-bold uppercase ${labelColor}`}>{isGroup ? 'Group' : 'Indiv.'}</div>
              </div>
              
              {/* Directions (Simplified) */}
              <div className="absolute inset-0 flex items-center justify-center w-48 h-48 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                  <div className={`absolute top-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>
                      <Eye size={20} />
                  </div>
                  <div className={`absolute bottom-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>
                       <Hand size={20} />
                  </div>
                  <div className={`absolute ${isMale ? 'right-0' : 'left-0'} flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>
                      {isMale ? <Footprints size={20} /> : <Footprints size={20} />}
                  </div>
              </div>
          </div>
      );
  };

  // Edit Modal Component
  const EditModal = () => {
      const log = logs.find(l => l.id === editingLogId);
      if (!log) return null;

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95
                  ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}
              `}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                          <Edit3 size={20} /> 記録を編集
                      </h3>
                      <button onClick={() => setEditingLogId(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="space-y-4">
                      {/* Gender Select */}
                      <div className="flex gap-2">
                          {(['Male', 'Female'] as const).map(g => (
                              <button
                                  key={g}
                                  onClick={() => updateLog(log.id, { gender: g })}
                                  className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all
                                      ${log.gender === g 
                                          ? (g === 'Male' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-rose-100 border-rose-500 text-rose-700')
                                          : 'border-slate-200 dark:border-slate-600 opacity-50'}
                                  `}
                              >
                                  {g === 'Male' ? '♂ 男' : '♀ 女'}
                              </button>
                          ))}
                      </div>

                      {/* Group Toggle */}
                      <div className="flex gap-2">
                          <button
                              onClick={() => updateLog(log.id, { isGroup: false })}
                              className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2
                                  ${!log.isGroup ? 'bg-slate-200 border-slate-400 text-slate-800' : 'border-slate-200 dark:border-slate-600 opacity-50'}
                              `}
                          >
                              <User size={18} /> 個人
                          </button>
                          <button
                              onClick={() => updateLog(log.id, { isGroup: true })}
                              className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2
                                  ${log.isGroup ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-slate-200 dark:border-slate-600 opacity-50'}
                              `}
                          >
                              <Users size={18} /> 集団
                          </button>
                      </div>

                      {/* Action Select */}
                      <div className="grid grid-cols-4 gap-2">
                          {(['Pass', 'Look', 'Stop', 'Use'] as const).map(act => (
                              <button
                                  key={act}
                                  onClick={() => updateLog(log.id, { action: act })}
                                  className={`py-2 rounded-lg text-xs font-bold border-2 flex flex-col items-center gap-1
                                      ${log.action === act 
                                          ? 'border-slate-800 bg-slate-100 dark:bg-slate-700 dark:border-white opacity-100 ring-2 ring-offset-1' 
                                          : 'border-transparent bg-slate-50 dark:bg-slate-700 opacity-60'}
                                  `}
                              >
                                  {ACTION_CONFIG[act].icon}
                                  {act}
                              </button>
                          ))}
                      </div>

                      {/* Note Input */}
                      <div>
                          <label className="text-xs font-bold opacity-70 mb-1 block">個人メモ / Note</label>
                          <input 
                              type="text" 
                              value={log.note}
                              onChange={(e) => updateLog(log.id, { note: e.target.value })}
                              placeholder="特徴など..."
                              className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 
                                  ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'}
                              `}
                          />
                      </div>

                      <div className="pt-4 flex gap-3 border-t border-slate-200 dark:border-slate-700">
                          <button 
                              onClick={() => setEditingLogId(null)}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold"
                          >
                              完了
                          </button>
                          <button 
                              onClick={() => deleteLog(log.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          >
                              <Trash2 size={24} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden touch-none select-none transition-colors duration-300
        ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}
    `}>
      {/* Edit Modal */}
      {editingLogId && <EditModal />}

      {/* Header */}
      <header className={`px-4 py-2 shadow-sm flex items-center justify-between shrink-0 z-20 h-14 border-b transition-colors duration-300
          ${settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className="flex items-center gap-2">
            <div className="leading-tight">
                <div className="font-bold text-lg">行動記録ロガー</div>
                <div className="text-[10px] opacity-60 font-mono tracking-wider">SHIKAKEOLOGY v4.0</div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {!isRecording && !isSetupMode && !isFinishing && (
                 <button onClick={initSession} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all">
                    <Play size={18} fill="currentColor" /> 開始
                </button>
            )}
            {isRecording && (
                <button onClick={stopSession} className="flex items-center gap-2 bg-slate-700 text-white px-5 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all animate-pulse dark:bg-slate-600">
                    <Square size={18} fill="currentColor" /> 終了
                </button>
            )}
            <button onClick={() => document.getElementById('settings-panel')?.classList.toggle('hidden')} className="p-2 rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                <Settings size={22} />
            </button>
        </div>
      </header>

      {/* Settings Panel */}
      <div id="settings-panel" className={`hidden absolute top-14 left-0 w-full z-30 p-4 border-b h-[calc(100vh-3.5rem)] overflow-y-auto backdrop-blur-md transition-colors duration-300
          ${settings.darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}
      `}>
          <div className="max-w-md mx-auto space-y-6 pb-20">
              {/* Settings Controls */}
              <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2"><Settings size={20}/> 環境設定</h3>
                  {/* Dark Mode */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex gap-3 items-center"><Moon size={20} className="text-purple-400"/><span>ナイトモード</span></div>
                      <button onClick={() => setSettings(s => ({...s, darkMode: !s.darkMode}))} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-purple-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-6' : ''}`}/>
                      </button>
                  </div>
                  {/* Sound */}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex gap-3 items-center"><Volume2 size={20} className="text-green-500"/><span>操作音 (SE)</span></div>
                      <button onClick={() => setSettings(s => ({...s, soundEnabled: !s.soundEnabled}))} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-green-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-6' : ''}`}/>
                      </button>
                  </div>
              </div>
              
              {/* History */}
              <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2"><History size={20}/> 保存済み履歴</h3>
                  {history.length === 0 ? <div className="text-center py-4 text-sm opacity-50">履歴なし</div> : (
                      <div className="space-y-3">
                          {history.map(item => (
                              <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div className="flex justify-between mb-2">
                                      <span className="font-bold text-sm">{new Date(item.date).toLocaleString()}</span>
                                      <button onClick={() => deleteHistoryItem(item.id)} className="text-red-400"><Trash2 size={16}/></button>
                                  </div>
                                  <button onClick={() => downloadCSV(item.logs, item.sessionInfo, 'history')} className="w-full py-2 bg-white dark:bg-slate-700 border rounded text-sm font-bold flex justify-center gap-2">
                                      <Download size={14}/> CSV DL
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Main Input Area (2x2 Grid) */}
      <main className="flex-1 flex relative">
          
        {/* Overlays (Start/Setup/Finish) - Same as previous, logic preserved */}
        {!isRecording && !isSetupMode && !isFinishing && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
                <div className={`p-8 rounded-3xl text-center w-full max-w-sm ${settings.darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <Play size={48} className="mx-auto mb-4 text-blue-500"/>
                    <h2 className="text-2xl font-bold mb-4">準備完了</h2>
                    <button onClick={initSession} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl">設定へ進む</button>
                </div>
            </div>
        )}
        {isSetupMode && (
             <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-6">
                <div className={`p-6 rounded-3xl w-full max-w-sm ${settings.darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="flex justify-between mb-4"><h2 className="font-bold text-xl">セッション設定</h2><button onClick={() => setIsSetupMode(false)}><X/></button></div>
                    <input type="text" placeholder="場所" className="w-full p-3 mb-4 border rounded-lg bg-transparent" value={sessionInfo.location} onChange={e => setSessionInfo({...sessionInfo, location: e.target.value})}/>
                    <textarea placeholder="メモ" className="w-full p-3 mb-6 border rounded-lg h-24 bg-transparent resize-none" value={sessionInfo.note} onChange={e => setSessionInfo({...sessionInfo, note: e.target.value})}/>
                    <button onClick={startRecording} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg flex justify-center gap-2"><Play/> 記録スタート</button>
                </div>
            </div>
        )}
        {isFinishing && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-6">
                <div className={`p-6 rounded-3xl w-full max-w-sm ${settings.darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="text-center mb-4"><CheckCircle size={48} className="text-emerald-500 mx-auto mb-2"/><h2 className="font-bold text-xl">終了確認</h2></div>
                    <textarea className="w-full p-3 mb-4 border rounded-lg h-20 bg-transparent text-sm resize-none" value={sessionInfo.note} onChange={e => setSessionInfo({...sessionInfo, note: e.target.value})}/>
                    <button onClick={archiveAndResetSession} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg mb-3 flex justify-center gap-2"><Archive/> 保存して終了</button>
                    <div className="flex gap-2">
                        <button onClick={() => setIsRecording(true) || setIsFinishing(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">再開</button>
                        <button onClick={() => downloadCSV(logs, sessionInfo, 'temp')} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold text-sm">仮保存</button>
                    </div>
                </div>
            </div>
        )}

        {/* 2x2 Grid Container */}
        <div className="flex-1 flex w-full h-full">
            {/* Left Column (Female) */}
            <div className={`flex-1 flex flex-col border-r-2 border-white/20`}>
                {/* Top-Left: Female Individual */}
                <div 
                    className={`flex-1 flex items-center justify-center relative touch-none border-b border-white/10
                        ${isRecording 
                            ? 'bg-rose-100 dark:bg-rose-900/30 active:bg-rose-200 dark:active:bg-rose-800/50' 
                            : settings.darkMode ? 'bg-rose-900/10' : 'bg-rose-50'
                        }`}
                    onTouchStart={(e) => handleTouchStart(e, 'Female', false)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {(isRecording || isFinishing) ? <StaticGuide gender="Female" isGroup={false} /> : <div className="text-center opacity-30 font-bold text-rose-400">♀ INDIV</div>}
                </div>
                {/* Bottom-Left: Female Group */}
                <div 
                    className={`flex-1 flex items-center justify-center relative touch-none border-t border-white/10
                        ${isRecording 
                            ? 'bg-rose-200 dark:bg-rose-900/50 active:bg-rose-300 dark:active:bg-rose-800/70' 
                            : settings.darkMode ? 'bg-rose-900/20' : 'bg-rose-100'
                        }`}
                    onTouchStart={(e) => handleTouchStart(e, 'Female', true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {(isRecording || isFinishing) ? <StaticGuide gender="Female" isGroup={true} /> : <div className="text-center opacity-30 font-bold text-rose-500">♀ GROUP</div>}
                </div>
            </div>

            {/* Right Column (Male) */}
            <div className={`flex-1 flex flex-col border-l-2 border-white/20`}>
                {/* Top-Right: Male Individual */}
                <div 
                    className={`flex-1 flex items-center justify-center relative touch-none border-b border-white/10
                        ${isRecording 
                            ? 'bg-blue-100 dark:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-800/50' 
                            : settings.darkMode ? 'bg-blue-900/10' : 'bg-blue-50'
                        }`}
                    onTouchStart={(e) => handleTouchStart(e, 'Male', false)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {(isRecording || isFinishing) ? <StaticGuide gender="Male" isGroup={false} /> : <div className="text-center opacity-30 font-bold text-blue-400">♂ INDIV</div>}
                </div>
                {/* Bottom-Right: Male Group */}
                <div 
                    className={`flex-1 flex items-center justify-center relative touch-none border-t border-white/10
                        ${isRecording 
                            ? 'bg-blue-200 dark:bg-blue-900/50 active:bg-blue-300 dark:active:bg-blue-800/70' 
                            : settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-100'
                        }`}
                    onTouchStart={(e) => handleTouchStart(e, 'Male', true)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {(isRecording || isFinishing) ? <StaticGuide gender="Male" isGroup={true} /> : <div className="text-center opacity-30 font-bold text-blue-500">♂ GROUP</div>}
                </div>
            </div>
        </div>

        {/* Dynamic Ring Menu Overlay - (No changes needed logic-wise, renders over grid) */}
        {activeTouch && (
             <div className="fixed pointer-events-none z-50" style={{ left: activeTouch.startX, top: activeTouch.startY, transform: 'translate(-50%, -50%)' }}>
                <div className={`rounded-full flex items-center justify-center border-2 border-white/50 w-40 h-40 ${ACTION_CONFIG[activeTouch.selectedAction].color} shadow-2xl`}>
                     <div className="text-white font-bold flex flex-col items-center">
                         {ACTION_CONFIG[activeTouch.selectedAction].icon}
                         {ACTION_CONFIG[activeTouch.selectedAction].label}
                     </div>
                </div>
             </div>
        )}
      </main>

      {/* Log Feed & Footer */}
      <div className={`h-1/3 border-t flex flex-col shrink-0 z-10 shadow-up transition-colors duration-300 pb-8
          ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
          <div className={`flex items-center justify-between px-4 py-2 border-b ${settings.darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-60">
                 <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                 直近の記録 (タップして編集)
              </span>
              <button onClick={undoLastLog} disabled={logs.length === 0 || !isRecording} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border opacity-70 hover:opacity-100">
                  <RotateCcw size={14} /> 1つ戻す
              </button>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${settings.darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
              {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-sm italic opacity-40">データはまだありません</div>
              ) : (
                  logs.map((log, i) => (
                      <div 
                        key={log.id} 
                        onClick={() => setEditingLogId(log.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl shadow-sm border text-sm animate-in fade-in slide-in-from-bottom-2 cursor-pointer active:scale-95 transition-transform
                          ${settings.darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:bg-slate-50'}
                      `}>
                          <span className="font-mono text-xs opacity-40 w-10 text-right">
                              {new Date(log.unixTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          </span>
                          
                          <div className={`flex items-center gap-1 font-bold w-16 ${log.gender === 'Male' ? 'text-blue-500' : 'text-rose-500'}`}>
                             {log.gender === 'Male' ? '♂' : '♀'}
                             {log.isGroup && <Users size={14} className="ml-1 opacity-70"/>}
                          </div>

                          <span className={`px-2 py-1 rounded text-xs font-bold text-white flex-1 text-center ${ACTION_CONFIG[log.action].color}`}>
                              {ACTION_CONFIG[log.action].label.split(' ')[0]}
                          </span>
                          
                          {log.note && <FileText size={14} className="opacity-40 text-blue-400" />}
                      </div>
                  ))
              )}
              <div ref={logsEndRef} className="h-10" /> {/* Extra spacer for easy scrolling */}
          </div>
      </div>
    </div>
  );
}