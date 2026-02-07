import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Download, Play, Square, RotateCcw, Settings, FileText, Trash2, Eye, Footprints, Hand, User, Moon, Volume2, Archive, History, CheckCircle, X, Users, Edit3, BookOpen, ExternalLink, Share, MoreVertical, Layers, MousePointer2, Smartphone } from 'lucide-react';

/**
 * ============================================================================
 * Shikakeology Action Logger (Refactored v5.3)
 * ============================================================================
 * * Update v5.3:
 * - 「記録開始（アイドル状態）」のオーバーレイUIを復活
 * - 各種UIインタラクションへのアニメーション（Micro-interactions）の追加
 * - アニメーションはTailwind CSSのクラスのみで実装し、ロジックの複雑化を回避
 */

// ============================================================================
// 1. Type Definitions & Constants
// ============================================================================

type ActionType = 'Pass' | 'Look' | 'Stop' | 'Use';
type Gender = 'Male' | 'Female';

interface LogEntry {
  id: string;
  timestamp: string; // ISO String
  unixTime: number;
  gender: Gender;
  isGroup: boolean;
  action: ActionType;
  note: string;
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
  date: string;
  sessionInfo: SessionInfo;
  logs: LogEntry[];
}

interface AppSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
}

const ACTION_CONFIG = {
  Pass: { label: '通行 (Pass)', color: 'bg-slate-400 dark:bg-slate-600', ringColor: '#94a3b8', icon: <User size={24} /> },
  Look: { label: '見た (Look)', color: 'bg-amber-500', ringColor: '#f59e0b', icon: <Eye size={24} /> },
  Stop: { label: '止まった (Stop)', color: 'bg-emerald-600', ringColor: '#059669', icon: <Footprints size={24} /> },
  Use:  { label: '使った (Use)', color: 'bg-pink-600', ringColor: '#db2777', icon: <Hand size={24} /> },
};

// ============================================================================
// 2. Custom Hooks (Logic)
// ============================================================================

const useAudioFeedback = (enabled: boolean, hapticsEnabled: boolean) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const getCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
        }
        return audioCtxRef.current;
    }, []);

    const playTone = useCallback((type: 'record' | 'undo' | 'open' | 'delete' | 'success') => {
        if (!enabled) return;
        try {
            const ctx = getCtx();
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume().catch(console.error);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            
            // Simple Tone Mapping
            if (type === 'record') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.05);
                gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'undo') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'open') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            } else if (type === 'delete') {
                osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'success') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(1046.5, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            }
        } catch (e) { console.error(e); }
    }, [enabled, getCtx]);

    const trigger = useCallback((type: 'record' | 'undo' | 'open' | 'delete' | 'success', hapticPattern?: number | number[]) => {
        if (hapticsEnabled && hapticPattern && navigator.vibrate) {
            try { navigator.vibrate(hapticPattern); } catch(e){}
        }
        playTone(type);
    }, [hapticsEnabled, playTone]);

    return { trigger };
};

const useShikakeLogger = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo>({ startTime: null, endTime: null, note: '', location: '' });
    const [history, setHistory] = useState<ArchivedSession[]>([]);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        try {
            const savedLogs = localStorage.getItem('shikake_logs');
            const savedSession = localStorage.getItem('shikake_session');
            const savedIsRecording = localStorage.getItem('shikake_is_recording');
            const savedHistory = localStorage.getItem('shikake_history');
            if (savedLogs) setLogs(JSON.parse(savedLogs));
            if (savedSession) setSessionInfo(JSON.parse(savedSession));
            if (savedIsRecording) setIsRecording(false);
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        localStorage.setItem('shikake_logs', JSON.stringify(logs));
        localStorage.setItem('shikake_session', JSON.stringify(sessionInfo));
        localStorage.setItem('shikake_is_recording', JSON.stringify(isRecording));
        localStorage.setItem('shikake_history', JSON.stringify(history));
    }, [logs, sessionInfo, isRecording, history]);

    const startSession = useCallback(() => {
        const now = Date.now();
        if (!sessionInfo.startTime) setSessionInfo(prev => ({ ...prev, startTime: now, endTime: null }));
        else setSessionInfo(prev => ({ ...prev, endTime: null }));
        setIsRecording(true);
    }, [sessionInfo.startTime]);

    const stopSession = useCallback(() => {
        setSessionInfo(prev => ({ ...prev, endTime: Date.now() }));
        setIsRecording(false);
    }, []);

    const addLog = useCallback((gender: Gender, isGroup: boolean, action: ActionType) => {
        const now = new Date();
        const isUse = action === 'Use';
        const newLog: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: now.toISOString(),
            unixTime: now.getTime(),
            gender, isGroup, action, note: '',
            isPass: true,
            isLook: action === 'Look' || action === 'Stop' || isUse,
            isStop: action === 'Stop' || isUse,
            isUse: isUse,
        };
        setLogs(prev => [...prev, newLog]);
    }, []);

    const updateLog = useCallback((id: string, updates: Partial<LogEntry>) => {
        setLogs(prev => prev.map(log => {
            if (log.id !== id) return log;
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
    }, []);

    const deleteLog = useCallback((id: string) => {
        setLogs(prev => prev.filter(l => l.id !== id));
    }, []);

    const undoLog = useCallback(() => {
        setLogs(prev => prev.slice(0, -1));
    }, []);

    const archiveSession = useCallback(() => {
        if (logs.length === 0) return false;
        const newArchive: ArchivedSession = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            sessionInfo: { ...sessionInfo, endTime: sessionInfo.endTime || Date.now() },
            logs: [...logs]
        };
        setHistory(prev => [newArchive, ...prev]);
        setLogs([]);
        setSessionInfo({ startTime: null, endTime: null, note: '', location: '' });
        return true;
    }, [logs, sessionInfo]);

    const deleteHistory = useCallback((id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    }, []);

    return {
        logs, sessionInfo, history, isRecording,
        setSessionInfo, setIsRecording,
        startSession, stopSession, addLog, updateLog, deleteLog, undoLog, archiveSession, deleteHistory
    };
};

const useTouchGesture = (isRecording: boolean, onActionDetermined: (gender: Gender, isGroup: boolean, action: ActionType) => void, onMove: () => void) => {
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

    const determineAction = (dx: number, dy: number, gender: Gender): ActionType => {
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 50) return 'Pass';
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        if (angle >= 225 && angle < 315) return 'Look';
        if (angle >= 45 && angle < 135) return 'Use';
        
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
            gender, isGroup,
            startX: touch.clientX, startY: touch.clientY,
            currentX: touch.clientX, currentY: touch.clientY,
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
            onMove();
        }
        setActiveTouch(prev => prev ? { ...prev, currentX: touch.clientX, currentY: touch.clientY, selectedAction: newAction } : null);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!activeTouch) return;
        onActionDetermined(activeTouch.gender, activeTouch.isGroup, activeTouch.selectedAction);
        setActiveTouch(null);
    };

    return { activeTouch, handleTouchStart, handleTouchMove, handleTouchEnd };
};

// ============================================================================
// 3. Sub-Components (UI)
// ============================================================================

/**
 * Utility: 詳細CSVエクスポート（元のアプリと同一の仕様）
 */
const downloadCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo, prefix: string) => {
    if (targetLogs.length === 0) { alert('No Data'); return; }

    const generateCSVContent = () => {
        const headers = [
            'ID', 'Timestamp_ISO', 'Timestamp_JST', 'UnixTime', 
            'Gender', 'Action_Raw', 'isGroup', 
            'isMale', 'isFemale', 'isGroup_Dummy', 
            'Passing(0)', 'Look(1)', 'Stop(2)', 'Use(3)',
            'Note'
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
                `"${(log.note || '').replace(/"/g, '""')}"`
            ];
        });

        const startTimeStr = targetInfo.startTime ? new Date(targetInfo.startTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
        const endTimeStr = targetInfo.endTime ? new Date(targetInfo.endTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
        const sanitizedNote = (targetInfo.note || '').replace(/[\n\r,]/g, ' ');

        return [
          `# Shikakeology Data Export (v5.1)`,
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
    
    // 1. Determine base time (Session Start Time or Current Time)
    const baseTime = targetInfo.startTime ? new Date(targetInfo.startTime) : new Date();
    
    // Format: YYYY-MM-DD_HH-mm-ss
    const dateStr = baseTime.getFullYear() + '-' +
        String(baseTime.getMonth() + 1).padStart(2, '0') + '-' +
        String(baseTime.getDate()).padStart(2, '0') + '_' +
        String(baseTime.getHours()).padStart(2, '0') + '-' +
        String(baseTime.getMinutes()).padStart(2, '0') + '-' +
        String(baseTime.getSeconds()).padStart(2, '0');

    // 2. Sanitize Note & Location for Filename
    let metaStr = '';
    if (targetInfo.location) metaStr += `_${targetInfo.location}`;
    if (targetInfo.note) metaStr += `_${targetInfo.note.slice(0, 10)}`;
    metaStr = metaStr.replace(/[\\/:*?"<>| \n\r]/g, '_');

    const filename = `${prefix}_${dateStr}${metaStr}.csv`;
    const csvContent = generateCSVContent();
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Component: Static Guide Icon
const StaticGuide = ({ gender, isGroup }: { gender: Gender, isGroup: boolean }) => {
    const isMale = gender === 'Male';
    const labelColor = isMale ? 'text-blue-100' : 'text-rose-100';
    const icon = isGroup ? <Users size={32} /> : <User size={32} />;
    
    return (
        <div className={`absolute pointer-events-none flex flex-col items-center justify-center opacity-60 scale-75 animate-in fade-in duration-500`}>
            <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center mb-2
                ${isMale ? 'border-blue-300/30 bg-blue-800/20' : 'border-rose-300/30 bg-rose-800/20'}`}>
                <div className={`${labelColor} opacity-80 mb-1`}>{icon}</div>
                <div className={`text-xs font-bold uppercase ${labelColor}`}>{isGroup ? 'Group' : 'Indiv.'}</div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center w-48 h-48 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                <div className={`absolute top-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}><Eye size={20} /></div>
                <div className={`absolute bottom-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}><Hand size={20} /></div>
                <div className={`absolute ${isMale ? 'right-0' : 'left-0'} flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}><Footprints size={20} /></div>
            </div>
        </div>
    );
};

// Component: Guide Modal (Animated)
const GuideModal = ({ settings, onClose }: { settings: AppSettings, onClose: () => void }) => {
    const [tab, setTab] = useState<'theory' | 'usage' | 'install'>('theory');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300 animate-in fade-in">
        <div 
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200
            ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}
            `}
        >
          <div className={`p-4 border-b flex justify-between items-center ${settings.darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500"/> ガイドブック
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 transition-colors"><X size={24}/></button>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'theory', label: '理論背景', icon: <Layers size={16}/> },
              { id: 'usage', label: '使い方', icon: <MousePointer2 size={16}/> },
              { id: 'install', label: 'インストール', icon: <Smartphone size={16}/> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-200
                  ${tab === t.id 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'}
                `}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {tab === 'theory' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold flex items-center gap-2">仕掛学における関与プロセス</h3>
                <p className="text-sm leading-relaxed opacity-80">
                  本アプリは、仕掛け（Shikake）に対する人々の行動変容を記録するために設計されています。
                  特に対象への**「関与の深さ（Engagement）」**を以下の4段階のファネル（漏斗）モデルで捉えます。
                </p>
                <div className={`p-4 rounded-xl border ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                      <div>
                        <div className="font-bold text-pink-600">使った (Use)</div>
                        <div className="text-xs opacity-70">仕掛けに物理的に接触した、または意図された行動を完遂した状態。</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                      <div>
                        <div className="font-bold text-emerald-600">止まった (Stop)</div>
                        <div className="text-xs opacity-70">足を止めて仕掛けを観察した状態。興味・関心が高まっている段階。</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">1</div>
                      <div>
                        <div className="font-bold text-amber-500">見た (Look)</div>
                        <div className="text-xs opacity-70">歩きながら視線を向けた、あるいは存在に気づいた状態。</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold shrink-0">0</div>
                      <div>
                        <div className="font-bold text-slate-500">通行 (Pass)</div>
                        <div className="text-xs opacity-70">仕掛けの設置エリアを通過した全ての人（分母）。</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            {tab === 'usage' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="space-y-2">
                    <h3 className="font-bold border-b pb-1 dark:border-slate-600">操作方法</h3>
                    <p className="text-sm opacity-80">画面を長押しして、対象者の行動に合わせて指をスライドさせます。</p>
                    <ul className="text-sm space-y-2 pl-2 mt-2">
                        <li className="flex items-center gap-2"><span className="font-bold">⬆ 上へ:</span> <span className="bg-amber-100 text-amber-800 px-1 rounded">見た (Look)</span></li>
                        <li className="flex items-center gap-2"><span className="font-bold">⬅➡ 外側へ:</span> <span className="bg-emerald-100 text-emerald-800 px-1 rounded">止まった (Stop)</span></li>
                        <li className="flex items-center gap-2"><span className="font-bold">⬇ 下へ:</span> <span className="bg-pink-100 text-pink-800 px-1 rounded">使った (Use)</span></li>
                        <li className="flex items-center gap-2"><span className="font-bold">指を離す:</span> <span className="bg-slate-100 text-slate-800 px-1 rounded">通行のみ (Pass)</span></li>
                    </ul>
                 </div>
              </div>
            )}
            {tab === 'install' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`p-4 rounded-xl border-l-4 border-blue-500 ${settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-1">PWA (Progressive Web App)</h3>
                    <p className="text-xs opacity-80">ホーム画面に追加することで、オフラインでも動くネイティブアプリのように使用できます。</p>
                </div>
                <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">🍎 iOS (Safari)</h3>
                    <p className="text-sm opacity-80">共有ボタン <Share size={12} className="inline"/> → 「ホーム画面に追加」</p>
                </div>
                <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 border-b pb-2">🤖 Android (Chrome)</h3>
                    <p className="text-sm opacity-80">メニュー <MoreVertical size={12} className="inline"/> → 「アプリをインストール」</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

// Component: Edit Modal (Animated)
const EditModal: React.FC<{ 
    log: LogEntry | undefined, 
    darkMode: boolean, 
    onClose: () => void, 
    onUpdate: (id: string, u: Partial<LogEntry>) => void, 
    onDelete: (id: string) => void 
}> = ({ log, darkMode, onClose, onUpdate, onDelete }) => {
    const [localNote, setLocalNote] = useState('');
    useEffect(() => { if (log) setLocalNote(log.note || ''); }, [log]);
    
    if (!log) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300 animate-in fade-in">
            <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2"><Edit3 size={20}/> 編集</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 transition-colors"><X size={24}/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        {(['Male', 'Female'] as const).map(g => (
                            <button key={g} onClick={() => onUpdate(log.id, { gender: g })}
                                className={`flex-1 py-2 rounded border-2 font-bold transition-all active:scale-95 ${log.gender === g ? (g === 'Male' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-rose-100 border-rose-500 text-rose-800') : 'opacity-50'}`}>
                                {g}
                            </button>
                        ))}
                    </div>
                     <div className="grid grid-cols-4 gap-2">
                        {(['Pass', 'Look', 'Stop', 'Use'] as const).map(act => (
                            <button key={act} onClick={() => onUpdate(log.id, { action: act })}
                                className={`py-2 rounded border-2 text-xs font-bold flex flex-col items-center transition-all active:scale-95 ${log.action === act ? 'bg-slate-200 border-slate-500 text-slate-900' : 'opacity-50'}`}>
                                {ACTION_CONFIG[act].icon}{act}
                            </button>
                        ))}
                    </div>
                    <input type="text" value={localNote} onChange={e => setLocalNote(e.target.value)} onBlur={() => onUpdate(log.id, {note: localNote})} 
                        className="w-full p-2 border rounded bg-transparent transition-colors focus:ring-2 focus:ring-blue-500" placeholder="Note" />
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors">完了</button>
                        <button onClick={() => { onDelete(log.id); onClose(); }} className="p-2 text-red-500 bg-red-100 rounded hover:bg-red-200 transition-colors"><Trash2/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component: Settings & History Panel (Animated)
const SettingsPanel: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    settings: AppSettings,
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>,
    history: ArchivedSession[],
    onDeleteHistory: (id: string) => void,
    onOpenGuide: () => void
}> = ({ isOpen, onClose, settings, setSettings, history, onDeleteHistory, onOpenGuide }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className={`absolute top-0 left-0 w-full p-4 h-full overflow-y-auto max-w-md shadow-xl animate-in slide-in-from-top-10 duration-300 ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}`} onClick={e => e.stopPropagation()}>
                <div className="space-y-6 pb-20">
                    <button onClick={onOpenGuide} className="w-full py-4 rounded-xl font-bold bg-slate-100 text-slate-800 flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors active:scale-95 transform"><BookOpen className="text-blue-500"/> ガイドブック</button>
                    <div>
                        <h3 className="font-bold border-b pb-2 mb-2">設定</h3>
                        <div className="flex justify-between items-center p-3 mb-2 rounded bg-slate-100/10 border">
                            <span>ナイトモード</span>
                            <button onClick={() => setSettings(s => ({...s, darkMode: !s.darkMode}))} className={`px-3 py-1 rounded transition-colors ${settings.darkMode ? 'bg-purple-600 text-white' : 'bg-slate-300'}`}>{settings.darkMode ? 'ON' : 'OFF'}</button>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded bg-slate-100/10 border">
                            <span>操作音</span>
                            <button onClick={() => setSettings(s => ({...s, soundEnabled: !s.soundEnabled}))} className={`px-3 py-1 rounded transition-colors ${settings.soundEnabled ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>{settings.soundEnabled ? 'ON' : 'OFF'}</button>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold border-b pb-2 mb-2">履歴</h3>
                        {history.map(h => (
                            <div key={h.id} className="p-3 mb-2 rounded border flex justify-between items-center bg-slate-100/5 hover:bg-slate-100/10 transition-colors">
                                <div>
                                    <div className="font-bold text-sm">{new Date(h.date).toLocaleString()}</div>
                                    <div className="text-xs opacity-60">{h.logs.length} records</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => downloadCSV(h.logs, h.sessionInfo, 'history')} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"><Download size={16}/></button>
                                    <button onClick={() => onDeleteHistory(h.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 4. Main Application (App.tsx)
// ============================================================================

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('shikake_settings');
      return saved ? JSON.parse(saved) : { hapticsEnabled: true, soundEnabled: true, darkMode: false };
  });

  useEffect(() => {
    localStorage.setItem('shikake_settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings]);

  // Use Custom Hooks
  const { trigger } = useAudioFeedback(settings.soundEnabled, settings.hapticsEnabled);
  const logger = useShikakeLogger();
  const { logs, sessionInfo, history, isRecording } = logger;

  // Touch Logic Integration
  const { activeTouch, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGesture(
      isRecording,
      (gender, isGroup, action) => { // On Action Determined
          logger.addLog(gender, isGroup, action);
          trigger('record', 50);
      },
      () => trigger('record', 15) // On Action Change (Haptic feedback)
  );

  // UI State
  const [uiState, setUiState] = useState({
      mode: 'idle' as 'idle' | 'setup' | 'recording' | 'finishing',
      isSettingsOpen: false,
      isGuideOpen: false,
      editingLogId: null as string | null
  });

  // --- Auto Scroll Ref ---
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll Effect: Scroll to bottom when logs change, BUT NOT when editing
  useEffect(() => {
    if (!uiState.editingLogId) {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, uiState.editingLogId]);


  // --- Handlers ---
  const handleStartSetup = () => {
      setUiState(prev => ({ ...prev, mode: 'setup' }));
      trigger('open', 10);
  };

  const handleStartRecording = () => {
      logger.startSession();
      setUiState(prev => ({ ...prev, mode: 'recording' }));
      trigger('success', 100);
  };

  const handleStopRecording = () => {
      logger.stopSession();
      setUiState(prev => ({ ...prev, mode: 'finishing' }));
      trigger('open', [50, 50]);
  };

  const handleArchive = () => {
      if (logger.archiveSession()) {
          setUiState(prev => ({ ...prev, mode: 'idle' }));
          trigger('success', [50, 100]);
      } else {
          alert('No data');
      }
  };

  // --- Rendering ---
  const { darkMode } = settings;
  const baseBg = darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800';
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden touch-none select-none transition-colors duration-300 ${baseBg}`}>
      
      {/* --- HEADER --- */}
      <header className={`px-4 py-2 flex justify-between items-center z-50 h-14 border-b ${darkMode ? 'bg-slate-900' : 'bg-white'} ${borderColor}`}>
        <div>
            <div className="font-bold text-lg">行動記録ロガー</div>
            <div className="text-[10px] font-mono opacity-50">Refactored v5.3</div>
        </div>
        <div className="flex gap-2">
            {uiState.mode === 'idle' && (
                <button onClick={handleStartSetup} className="flex gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all">
                    <Play size={18} /> 開始
                </button>
            )}
            {uiState.mode === 'recording' && (
                <button onClick={handleStopRecording} className="flex gap-2 bg-slate-700 text-white px-4 py-2 rounded-full font-bold shadow-md animate-pulse active:scale-95 transition-all">
                    <Square size={18} /> 終了
                </button>
            )}
            <button onClick={() => setUiState(p => ({...p, isSettingsOpen: !p.isSettingsOpen}))} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors">
                <Settings size={22} />
            </button>
        </div>
      </header>

      {/* --- OVERLAYS & MODALS --- */}
      {/* 1. Idle Mode Overlay (Welcome Screen) */}
      {uiState.mode === 'idle' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-300">
              <div className={`p-8 rounded-3xl text-center w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
                  <Play size={48} className="mx-auto mb-4 text-blue-500"/>
                  <h2 className="text-2xl font-bold mb-4">準備完了</h2>
                  <button onClick={handleStartSetup} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg active:scale-95 transition-transform">
                      設定へ進む
                  </button>
              </div>
          </div>
      )}

      {/* 2. Setup Overlay */}
      {uiState.mode === 'setup' && (
         <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-6 animate-in fade-in duration-300">
            <div className={`p-6 rounded-3xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <h2 className="font-bold text-xl mb-4">セッション設定</h2>
                <input className="w-full p-3 mb-4 border rounded bg-transparent transition-colors focus:ring-2 focus:ring-blue-500" placeholder="場所" 
                    value={sessionInfo.location} onChange={e => logger.setSessionInfo(p => ({...p, location: e.target.value}))} />
                <textarea className="w-full p-3 mb-6 border rounded bg-transparent h-24 resize-none transition-colors focus:ring-2 focus:ring-blue-500" placeholder="メモ" 
                    value={sessionInfo.note} onChange={e => logger.setSessionInfo(p => ({...p, note: e.target.value}))} />
                <div className="flex gap-2">
                    <button onClick={() => setUiState(p => ({...p, mode: 'idle'}))} className="flex-1 py-3 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">キャンセル</button>
                    <button onClick={handleStartRecording} className="flex-[2] bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition-colors active:scale-95">記録スタート</button>
                </div>
            </div>
        </div>
      )}

      {/* 3. Finishing Overlay (with Edit) */}
      {uiState.mode === 'finishing' && (
         <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-6 animate-in fade-in duration-300">
            <div className={`p-6 rounded-3xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-center mb-4"><CheckCircle size={48} className="text-emerald-500 mx-auto mb-2"/><h2 className="font-bold text-xl">終了確認</h2></div>
                <div className="mb-4 space-y-2">
                    <input className="w-full p-2 border rounded bg-transparent text-sm transition-colors focus:ring-2 focus:ring-emerald-500" placeholder="場所 (編集可)" 
                        value={sessionInfo.location} onChange={e => logger.setSessionInfo(p => ({...p, location: e.target.value}))} />
                    <textarea className="w-full p-2 border rounded bg-transparent h-20 resize-none text-sm transition-colors focus:ring-2 focus:ring-emerald-500" placeholder="メモ (編集可)" 
                        value={sessionInfo.note} onChange={e => logger.setSessionInfo(p => ({...p, note: e.target.value}))} />
                </div>
                <button onClick={handleArchive} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mb-3 hover:bg-emerald-700 transition-colors active:scale-95">保存して終了</button>
                <div className="flex gap-2">
                    <button onClick={() => setUiState(p => ({...p, mode: 'recording'}))} className="flex-1 py-3 rounded bg-slate-500/10 hover:bg-slate-500/20 transition-colors">再開</button>
                    <button onClick={() => downloadCSV(logs, sessionInfo, 'temp')} className="flex-1 py-3 rounded bg-slate-500/10 hover:bg-slate-500/20 transition-colors">仮保存</button>
                </div>
            </div>
        </div>
      )}
      
      {uiState.isGuideOpen && <GuideModal settings={settings} onClose={() => setUiState(p => ({...p, isGuideOpen: false}))} />}

      <SettingsPanel 
          isOpen={uiState.isSettingsOpen} 
          onClose={() => setUiState(p => ({...p, isSettingsOpen: false}))}
          settings={settings} setSettings={setSettings}
          history={history} onDeleteHistory={logger.deleteHistory}
          onOpenGuide={() => setUiState(p => ({...p, isGuideOpen: true}))}
      />
      
      <EditModal 
        log={logs.find(l => l.id === uiState.editingLogId)}
        darkMode={darkMode}
        onClose={() => setUiState(p => ({...p, editingLogId: null}))}
        onUpdate={logger.updateLog}
        onDelete={logger.deleteLog}
      />

      {/* --- MAIN TOUCH AREA --- */}
      <main className="flex-1 flex w-full relative">
        {/* Dynamic Action Ring (Fixed Position at Touch Start) */}
        {activeTouch && (
            <div className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-100" style={{ left: activeTouch.startX, top: activeTouch.startY }}>
               <div className={`rounded-full flex items-center justify-center border-2 border-white/50 w-40 h-40 ${ACTION_CONFIG[activeTouch.selectedAction].color} shadow-2xl transition-colors duration-200`}>
                    <div className="text-white font-bold flex flex-col items-center">
                        {ACTION_CONFIG[activeTouch.selectedAction].icon}
                        {ACTION_CONFIG[activeTouch.selectedAction].label}
                    </div>
               </div>
            </div>
        )}

        <div className="flex-1 flex flex-col border-r border-white/10">
            {/* Female Zone */}
            <TouchZone gender="Female" isGroup={false} isRecording={uiState.mode === 'recording'} onStart={handleTouchStart} onMove={handleTouchMove} onEnd={handleTouchEnd} color="bg-rose-100" darkColor="bg-rose-900/30" />
            <TouchZone gender="Female" isGroup={true} isRecording={uiState.mode === 'recording'} onStart={handleTouchStart} onMove={handleTouchMove} onEnd={handleTouchEnd} color="bg-rose-200" darkColor="bg-rose-900/50" />
        </div>
        <div className="flex-1 flex flex-col border-l border-white/10">
            {/* Male Zone */}
            <TouchZone gender="Male" isGroup={false} isRecording={uiState.mode === 'recording'} onStart={handleTouchStart} onMove={handleTouchMove} onEnd={handleTouchEnd} color="bg-blue-100" darkColor="bg-blue-900/30" />
            <TouchZone gender="Male" isGroup={true} isRecording={uiState.mode === 'recording'} onStart={handleTouchStart} onMove={handleTouchMove} onEnd={handleTouchEnd} color="bg-blue-200" darkColor="bg-blue-900/50" />
        </div>
      </main>

      {/* --- LOG FEED --- */}
      <div className={`h-1/3 border-t flex flex-col shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} ${borderColor}`}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-inherit bg-inherit">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-60">
                 <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                 RECORDING LOG
              </span>
              <button onClick={logger.undoLog} disabled={!isRecording || logs.length === 0} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border opacity-70 hover:opacity-100 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-95">
                  <RotateCcw size={14} /> Undo
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {logs.map((log, i) => (
                  <div key={log.id} onClick={() => setUiState(p => ({...p, editingLogId: log.id}))} 
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer animate-in slide-in-from-bottom-2 fade-in duration-200 hover:scale-[1.01] active:scale-95 transition-transform ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="font-mono font-bold w-6 text-right opacity-50">#{i + 1}</span>
                      <span className="font-mono opacity-50 w-12 text-right">{new Date(log.unixTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
                      <div className={`font-bold w-10 ${log.gender === 'Male' ? 'text-blue-500' : 'text-rose-500'}`}>{log.gender === 'Male' ? '♂' : '♀'} {log.isGroup && <Users size={12} className="inline"/>}</div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold text-white flex-1 text-center ${ACTION_CONFIG[log.action].color}`}>{ACTION_CONFIG[log.action].label}</span>
                  </div>
              ))}
              <div ref={logsEndRef} className="h-10" />
          </div>
      </div>
    </div>
  );
}

// --- Helper Component for Touch Zones ---
const TouchZone = ({ gender, isGroup, isRecording, onStart, onMove, onEnd, color, darkColor }: any) => {
    const isMale = gender === 'Male';
    return (
        <div 
            className={`flex-1 flex items-center justify-center relative touch-none border-b border-white/10 transition-colors duration-200
                ${isRecording 
                    ? `active:opacity-80 dark:${darkColor} ${color}` 
                    : 'bg-transparent opacity-50'
                }`}
            onTouchStart={(e) => onStart(e, gender, isGroup)}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
        >
            {isRecording ? <StaticGuide gender={gender} isGroup={isGroup} /> : (
                <div className={`text-center font-bold opacity-30 ${isMale ? 'text-blue-500' : 'text-rose-500'}`}>
                    {gender === 'Male' ? '♂' : '♀'} {isGroup ? 'GROUP' : 'INDIV'}
                </div>
            )}
        </div>
    );
};