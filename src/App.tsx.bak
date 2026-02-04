import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Play, Square, RotateCcw, Settings, FileText, Trash2, Eye, Footprints, Hand, User, Moon, Sun, Smartphone, Archive, History, CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Shikakeology Action Logger (PWA-ready) v3.2
 * 仕掛学に基づく行動観察用ロガー
 * * Update v3.2:
 * - セッション設定（場所・メモ）の入力フローを改善
 * - 開始時に設定ダイアログを表示し、入力してから計測開始するように変更
 * - 終了時（保存前）にもメモの追記・編集ができるようにUIを調整
 */

// --- Type Definitions ---

type ActionType = 'Pass' | 'Look' | 'Stop' | 'Use';
type Gender = 'Male' | 'Female';

interface LogEntry {
  id: string;
  timestamp: string; // ISO String
  unixTime: number;
  gender: Gender;
  action: ActionType;
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
  darkMode: boolean;
}

// --- Configuration ---

const ACTION_CONFIG = {
  Pass: { label: '通行 (Pass)', color: 'bg-slate-400 dark:bg-slate-600', ringColor: '#94a3b8', icon: <User size={24} /> },
  Look: { label: '見た (Look)', color: 'bg-amber-500', ringColor: '#f59e0b', icon: <Eye size={24} /> },
  Stop: { label: '止まった (Stop)', color: 'bg-emerald-600', ringColor: '#059669', icon: <Footprints size={24} /> },
  Use:  { label: '使った (Use)', color: 'bg-pink-600', ringColor: '#db2777', icon: <Hand size={24} /> },
};

export default function App() {
  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  
  // モード管理
  const [isSetupMode, setIsSetupMode] = useState(false); // 開始前の設定入力モード
  const [isFinishing, setIsFinishing] = useState(false); // 終了確認モード

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
    darkMode: false,
  });
  
  // Touch Interaction State
  const [activeTouch, setActiveTouch] = useState<{
    id: number;
    gender: Gender;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    selectedAction: ActionType;
  } | null>(null);

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Effects: Persistence ---

  useEffect(() => {
    // Load data from localStorage
    try {
      const savedLogs = localStorage.getItem('shikake_logs');
      const savedSession = localStorage.getItem('shikake_session');
      const savedIsRecording = localStorage.getItem('shikake_is_recording');
      const savedHistory = localStorage.getItem('shikake_history');
      const savedSettings = localStorage.getItem('shikake_settings');

      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedSession) setSessionInfo(JSON.parse(savedSession));
      
      // 復帰処理: Recording中だった場合はPausedに戻すか、Setup/Finishing状態をどうするか
      // 安全のため、記録中フラグが立っていたら「再開」待ちの状態にする（今回は簡易的にfalse）
      if (savedIsRecording) setIsRecording(false); 
      
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  useEffect(() => {
    // Save data to localStorage
    localStorage.setItem('shikake_logs', JSON.stringify(logs));
    localStorage.setItem('shikake_session', JSON.stringify(sessionInfo));
    localStorage.setItem('shikake_is_recording', JSON.stringify(isRecording));
    localStorage.setItem('shikake_history', JSON.stringify(history));
    localStorage.setItem('shikake_settings', JSON.stringify(settings));
    
    // Apply Dark Mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [logs, sessionInfo, isRecording, history, settings]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Helper: Haptics ---

  const triggerHaptic = (duration: number | number[]) => {
    if (!settings.hapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch (e) {
      console.warn("Haptics failed", e);
    }
  };

  // --- Logic: Data Recording ---

  // 1. 開始ボタン押下 -> セットアップモードへ
  const initSession = () => {
      // 既存データがある状態で開始ボタンを押した場合のハンドリング
      // ここでは「新規セッション設定」を開く
      setIsSetupMode(true);
      setIsFinishing(false);
  };

  // 2. セットアップ完了 -> 記録開始
  const startRecording = () => {
    const now = Date.now();
    
    // 開始時刻を設定（既に記録データがある場合の再開ロジックも考慮）
    if (!sessionInfo.startTime) {
        setSessionInfo(prev => ({ ...prev, startTime: now, endTime: null }));
    } else {
        // 再開時はEndTimeをクリア
        setSessionInfo(prev => ({ ...prev, endTime: null }));
    }
    
    setIsSetupMode(false);
    setIsRecording(true);
    triggerHaptic(100);
  };

  const cancelSetup = () => {
      setIsSetupMode(false);
  };

  // 3. 終了ボタン押下 -> 終了確認モードへ
  const stopSession = () => {
    if (!isRecording) return;
    
    setSessionInfo(prev => ({ ...prev, endTime: Date.now() }));
    setIsRecording(false);
    setIsFinishing(true); 
    triggerHaptic([50, 50, 50]);
  };

  const addLog = (gender: Gender, action: ActionType) => {
    if (!isRecording) return;

    triggerHaptic(50);

    const now = new Date();
    
    const isUse = action === 'Use';
    const isStop = action === 'Stop' || isUse;
    const isLook = action === 'Look' || isStop;
    const isPass = true; 

    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      unixTime: now.getTime(),
      gender,
      action,
      isPass,
      isLook,
      isStop,
      isUse,
    };

    setLogs(prev => [...prev, newLog]);
  };

  const undoLastLog = () => {
    setLogs(prev => prev.slice(0, -1));
    triggerHaptic(30);
  };

  // 4. セッションを確定して履歴に保存
  const archiveAndResetSession = () => {
    if (logs.length === 0) {
      alert('保存するデータがありません。');
      setIsFinishing(false);
      return;
    }
    
    const newArchive: ArchivedSession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        sessionInfo: { 
            ...sessionInfo, 
            endTime: sessionInfo.endTime || Date.now()
        },
        logs: [...logs]
    };

    setHistory(prev => [newArchive, ...prev]);
    
    // リセット
    setLogs([]);
    setSessionInfo({ startTime: null, endTime: null, note: '', location: '' });
    setIsFinishing(false);
    
    triggerHaptic([50, 100]);
    alert('セッションを保存しました！');
  };

  const resumeSession = () => {
      setIsFinishing(false);
      setIsRecording(true);
  };

  const deleteHistoryItem = (id: string) => {
      if(window.confirm('この履歴データを削除しますか？')) {
          setHistory(prev => prev.filter(item => item.id !== id));
      }
  };

  const clearCurrentData = () => {
    if (window.confirm('現在の【入力中】のデータを全て消去しますか？（履歴は消えません）')) {
      setLogs([]);
      setSessionInfo({ startTime: null, endTime: null, note: '', location: '' });
      setIsRecording(false);
      setIsFinishing(false);
      setIsSetupMode(false);
    }
  };

  // --- Logic: CSV Export ---

  const generateCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo) => {
    const headers = [
        'ID', 
        'Timestamp_ISO', 
        'Timestamp_JST', 
        'UnixTime', 
        'Gender', 
        'Action_Raw', 
        'isMale', 
        'isFemale', 
        'Passing(0)', 
        'Look(1)', 
        'Stop(2)', 
        'Use(3)'
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
            log.gender === 'Male' ? '1' : '0',
            log.gender === 'Female' ? '1' : '0',
            log.isPass ? '1' : '0',
            log.isLook ? '1' : '0',
            log.isStop ? '1' : '0',
            log.isUse ? '1' : '0',
        ];
    });

    const startTimeStr = targetInfo.startTime ? new Date(targetInfo.startTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
    const endTimeStr = targetInfo.endTime ? new Date(targetInfo.endTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
    const sanitizedNote = (targetInfo.note || '').replace(/[\n\r,]/g, ' ');

    return [
      `# Shikakeology Data Export (v3.2)`,
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

  const downloadCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo, filenamePrefix: string) => {
    if (targetLogs.length === 0) {
      alert('記録データがありません');
      return;
    }

    const csvContent = generateCSV(targetLogs, targetInfo);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Logic: Touch Gesture Handling ---

  const determineAction = (dx: number, dy: number, gender: Gender): ActionType => {
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 50) return 'Pass';

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Up: Look (225-315)
    if (angle >= 225 && angle < 315) return 'Look';
    // Down: Use (45-135)
    if (angle >= 45 && angle < 135) return 'Use';
    // Side: Stop
    if (gender === 'Male') {
       if (angle >= 315 || angle < 45) return 'Stop';
    } else {
       if (angle >= 135 && angle < 225) return 'Stop';
    }
    return 'Pass';
  };

  const handleTouchStart = (e: React.TouchEvent, gender: Gender) => {
    if (!isRecording) return;
    const touch = e.changedTouches[0];
    setActiveTouch({
      id: touch.identifier,
      gender,
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
       triggerHaptic(15);
    }

    setActiveTouch(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      selectedAction: newAction
    } : null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!activeTouch) return;
    addLog(activeTouch.gender, activeTouch.selectedAction);
    setActiveTouch(null);
  };

  // --- UI Components ---

  const StaticGuide = ({ gender }: { gender: Gender }) => {
      const isMale = gender === 'Male';
      const labelColor = isMale ? 'text-blue-100' : 'text-rose-100';
      
      return (
          <div className={`absolute pointer-events-none flex flex-col items-center justify-center opacity-60`}>
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-2
                  ${isMale 
                      ? 'border-blue-300/30 bg-blue-800/20 dark:border-blue-400/30 dark:bg-blue-900/40' 
                      : 'border-rose-300/30 bg-rose-800/20 dark:border-rose-400/30 dark:bg-rose-900/40'
                  }`}
              >
                 <div className={`text-4xl font-bold opacity-50 ${labelColor}`}>{isMale ? '♂' : '♀'}</div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center w-64 h-64 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                  <div className={`absolute top-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>
                      <Eye size={24} />
                      <span className="text-xs font-bold tracking-widest mt-1 drop-shadow-md">見た</span>
                  </div>
                  <div className={`absolute bottom-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>
                       <span className="text-xs font-bold tracking-widest mb-1 drop-shadow-md">使った</span>
                       <Hand size={24} />
                  </div>
                  <div className={`absolute ${isMale ? 'right-0' : 'left-0'} flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>
                      <div className="flex items-center gap-1">
                          {isMale ? null : <Footprints size={24} />}
                          <span className="text-xs font-bold tracking-widest writing-vertical drop-shadow-md">止まった</span>
                          {isMale ? <Footprints size={24} /> : null}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderRingMenu = () => {
    if (!activeTouch) return null;
    const { startX, startY, gender, selectedAction } = activeTouch;
    const config = ACTION_CONFIG[selectedAction];
    
    return (
      <div 
        className="fixed pointer-events-none z-50 transition-all duration-75"
        style={{ left: startX, top: startY, transform: 'translate(-50%, -50%)' }}
      >
        <div 
            className={`rounded-full flex items-center justify-center transition-all duration-200 border-2 border-white/50
                ${selectedAction === 'Pass' ? 'w-32 h-32 bg-slate-500/20' : `w-40 h-40 ${config.color} shadow-2xl scale-110`}
            `}
        >
             <div className="text-white font-bold text-lg flex flex-col items-center drop-shadow-md">
                 <div className="mb-1">{config.icon}</div>
                 <span className="whitespace-nowrap">{config.label}</span>
             </div>
        </div>
        <svg className="absolute top-0 left-0 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 overflow-visible opacity-60">
            <line 
                x1="250" y1="250" 
                x2={250 + (activeTouch.currentX - startX)} 
                y2={250 + (activeTouch.currentY - startY)} 
                stroke={config.ringColor} 
                strokeWidth="6" 
                strokeLinecap="round"
            />
            <circle 
                cx={250 + (activeTouch.currentX - startX)} 
                cy={250 + (activeTouch.currentY - startY)} 
                r="12" 
                fill={config.ringColor}
                stroke="white"
                strokeWidth="3" 
            />
        </svg>
      </div>
    );
  };

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden touch-none select-none transition-colors duration-300
        ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}
    `}>
      
      {/* Header */}
      <header className={`px-4 py-2 shadow-sm flex items-center justify-between shrink-0 z-20 h-14 border-b transition-colors duration-300
          ${settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className="flex items-center gap-2">
            <div className="leading-tight">
                <div className={`font-bold text-lg ${settings.darkMode ? 'text-slate-100' : 'text-slate-700'}`}>行動記録ロガー</div>
                <div className="text-[10px] text-slate-400 font-mono tracking-wider">SHIKAKEOLOGY v3.2</div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {!isRecording && !isSetupMode && !isFinishing && (
                 <button 
                    onClick={initSession}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all hover:bg-blue-700"
                >
                    <Play size={18} fill="currentColor" />
                    開始
                </button>
            )}
            
            {isRecording && (
                <button 
                    onClick={stopSession}
                    className="flex items-center gap-2 bg-slate-700 text-white px-5 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all hover:bg-slate-800 animate-pulse dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                    <Square size={18} fill="currentColor" />
                    終了
                </button>
            )}
            
            <button 
                onClick={() => {
                    const el = document.getElementById('settings-panel');
                    el?.classList.toggle('hidden');
                }}
                className={`p-2 rounded-full transition-colors ${settings.darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Settings size={22} />
            </button>
        </div>
      </header>

      {/* Settings Panel */}
      <div id="settings-panel" className={`hidden absolute top-14 left-0 w-full z-30 p-4 border-b h-[calc(100vh-3.5rem)] overflow-y-auto backdrop-blur-md transition-colors duration-300
          ${settings.darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}
      `}>
          <div className="max-w-md mx-auto space-y-6 pb-20">
              
              {/* Basic Settings */}
              <div className="space-y-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-lg border-b pb-2 border-slate-200 dark:border-slate-700">
                      <Settings size={20}/> 環境設定
                  </h3>
                  
                  {/* Dark Mode */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-3">
                          {settings.darkMode ? <Moon size={20} className="text-purple-400"/> : <Sun size={20} className="text-amber-500"/>}
                          <div>
                              <div className="font-bold text-sm">ナイトモード</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">夜間調査用の暗色テーマ</div>
                          </div>
                      </div>
                      <button 
                          onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.darkMode ? 'bg-purple-600' : 'bg-slate-300'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </div>

                  {/* Haptics */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-3">
                          <Smartphone size={20} className={settings.hapticsEnabled ? 'text-blue-500' : 'text-slate-400'}/>
                          <div>
                              <div className="font-bold text-sm">触覚フィードバック</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">操作時の振動 (Haptics)</div>
                          </div>
                      </div>
                      <button 
                          onClick={() => {
                              const newValue = !settings.hapticsEnabled;
                              setSettings(s => ({ ...s, hapticsEnabled: newValue }));
                              if (newValue) navigator.vibrate?.(50);
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.hapticsEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </div>
              </div>

              {/* History */}
              <div className="space-y-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-lg border-b pb-2 border-slate-200 dark:border-slate-700">
                      <History size={20}/> 保存済み履歴 ({history.length})
                  </h3>
                  
                  {history.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                          履歴データはありません
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {history.map((item) => (
                              <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <div className="font-bold text-sm">
                                              {new Date(item.date).toLocaleString('ja-JP')}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                              場所: {item.sessionInfo.location || '(未入力)'}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400">
                                              記録数: {item.logs.length}件
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => deleteHistoryItem(item.id)}
                                        className="p-1 text-slate-400 hover:text-red-500"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                                  <button 
                                      onClick={() => downloadCSV(item.logs, item.sessionInfo, `shikake_history`)}
                                      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-600"
                                  >
                                      <Download size={14} /> CSVダウンロード
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={clearCurrentData}
                    className="w-full flex items-center justify-center gap-2 text-red-500 dark:text-red-400 p-2 text-sm hover:underline"
                  >
                      <Trash2 size={14} /> 全データをリセット
                  </button>
              </div>
          </div>
      </div>

      {/* Main Input Area */}
      <main className="flex-1 flex relative">
        
        {/* State 1: Start Screen (Waiting) */}
        {!isRecording && !isSetupMode && !isFinishing && (
            <div className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm px-6
                ${settings.darkMode ? 'bg-slate-900/70' : 'bg-slate-900/60'}
            `}>
                <div className={`p-8 rounded-3xl shadow-2xl text-center w-full max-w-sm
                    ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}
                `}>
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play size={32} fill="currentColor" className="ml-1"/>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">準備完了</h2>
                    <p className={`mb-6 text-sm leading-relaxed ${settings.darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                        「開始」ボタンを押して、<br/>調査場所の設定を行ってください。
                    </p>
                    <button 
                        onClick={initSession}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-transform"
                    >
                        設定へ進む
                    </button>
                </div>
            </div>
        )}

        {/* State 2: Setup Mode (Input Info) */}
        {isSetupMode && (
             <div className={`absolute inset-0 z-30 flex items-center justify-center backdrop-blur-md px-6
                ${settings.darkMode ? 'bg-slate-900/90' : 'bg-slate-900/80'}
             `}>
                <div className={`p-6 rounded-3xl shadow-2xl w-full max-w-sm border-2 animate-in fade-in zoom-in-95
                    ${settings.darkMode ? 'bg-slate-800 border-blue-500/50 text-slate-100' : 'bg-white border-blue-200 text-slate-800'}
                `}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="text-blue-500"/> セッション設定
                        </h2>
                        <button onClick={cancelSetup} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs font-bold opacity-70 mb-1 block">調査場所 / Location</label>
                            <input 
                                type="text" 
                                placeholder="例: A棟入口前" 
                                autoFocus
                                className={`w-full p-3 border rounded-lg outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all
                                    ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'}
                                `}
                                value={sessionInfo.location}
                                onChange={e => setSessionInfo({...sessionInfo, location: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold opacity-70 mb-1 block">メモ / Note</label>
                            <textarea 
                                placeholder="天候、気温、特記事項など..." 
                                className={`w-full p-3 border rounded-lg h-24 outline-none ring-2 ring-transparent focus:ring-blue-500 resize-none transition-all
                                    ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'}
                                `}
                                value={sessionInfo.note}
                                onChange={e => setSessionInfo({...sessionInfo, note: e.target.value})}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={startRecording}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Play size={20} fill="currentColor"/>
                        記録スタート
                    </button>
                </div>
            </div>
        )}

        {/* State 3: Finishing (Paused & Confirm Save) */}
        {isFinishing && (
            <div className={`absolute inset-0 z-30 flex items-center justify-center backdrop-blur-md px-6
                ${settings.darkMode ? 'bg-slate-900/80' : 'bg-slate-900/70'}
            `}>
                <div className={`p-6 rounded-3xl shadow-2xl w-full max-w-sm border-2 animate-in fade-in zoom-in-95
                    ${settings.darkMode ? 'bg-slate-800 border-emerald-500/50 text-slate-100' : 'bg-white border-emerald-100 text-slate-800'}
                `}>
                    <div className="text-center mb-4">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                        <h2 className="text-xl font-bold">セッション終了</h2>
                        <p className="text-xs opacity-60">保存前にメモを追記できます</p>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-bold opacity-70 mb-1 block">最終メモ / Final Note</label>
                        <textarea 
                            className={`w-full p-3 border rounded-lg h-20 outline-none focus:border-emerald-500 resize-none transition-all text-sm
                                ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'}
                            `}
                            value={sessionInfo.note}
                            onChange={e => setSessionInfo({...sessionInfo, note: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={archiveAndResetSession}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Archive size={20} />
                            保存して終了
                        </button>
                        
                        <div className="flex gap-2">
                             <button 
                                onClick={resumeSession}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm active:scale-95 transition-transform
                                    ${settings.darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}
                                `}
                            >
                                <Play size={14} className="inline mr-1"/> 再開
                            </button>
                             <button 
                                onClick={() => downloadCSV(logs, sessionInfo, 'shikake_temp')}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm active:scale-95 transition-transform
                                    ${settings.darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}
                                `}
                            >
                                <Download size={14} className="inline mr-1"/> 仮保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Female Input Zone (Left) */}
        <div 
            className={`flex-1 flex flex-col items-center justify-center relative touch-none transition-colors duration-300
                ${isRecording 
                    ? 'bg-rose-700 active:bg-rose-800 dark:bg-rose-900 dark:active:bg-rose-950' 
                    : settings.darkMode ? 'bg-rose-900/20' : 'bg-rose-100'
                }
            `}
            onTouchStart={(e) => handleTouchStart(e, 'Female')}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="pointer-events-none flex flex-col items-center justify-center h-full w-full">
                {(isRecording || isFinishing) ? <StaticGuide gender="Female" /> : (
                    <div className={`text-center opacity-50 ${settings.darkMode ? 'text-rose-400' : 'text-rose-300'}`}>
                        <span className="text-8xl font-black block mb-4">♀</span>
                        <span className="text-2xl font-bold tracking-widest">FEMALE</span>
                    </div>
                )}
            </div>
        </div>

        {/* Male Input Zone (Right) */}
        <div 
            className={`flex-1 flex flex-col items-center justify-center relative touch-none transition-colors duration-300 border-l-2 border-white/10
                ${isRecording 
                    ? 'bg-blue-700 active:bg-blue-800 dark:bg-blue-900 dark:active:bg-blue-950' 
                    : settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-100'
                }
            `}
            onTouchStart={(e) => handleTouchStart(e, 'Male')}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
             <div className="pointer-events-none flex flex-col items-center justify-center h-full w-full">
                {(isRecording || isFinishing) ? <StaticGuide gender="Male" /> : (
                    <div className={`text-center opacity-50 ${settings.darkMode ? 'text-blue-400' : 'text-blue-300'}`}>
                        <span className="text-8xl font-black block mb-4">♂</span>
                        <span className="text-2xl font-bold tracking-widest">MALE</span>
                    </div>
                )}
            </div>
        </div>

        {/* Dynamic Ring Menu Overlay */}
        {renderRingMenu()}
      </main>

      {/* Log Feed & Footer */}
      <div className={`h-1/3 border-t flex flex-col shrink-0 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] transition-colors duration-300
          ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
          <div className={`flex items-center justify-between px-4 py-2 border-b transition-colors
              ${settings.darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}
          `}>
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2
                  ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}
              `}>
                 <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                 直近の記録 ({logs.length})
              </span>
              <button 
                onClick={undoLastLog}
                disabled={logs.length === 0 || !isRecording}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-sm border
                    ${settings.darkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}
                `}
              >
                  <RotateCcw size={14} /> 1つ戻す
              </button>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-2 space-y-2
              ${settings.darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}
          `}>
              {logs.length === 0 ? (
                  <div className={`h-full flex flex-col items-center justify-center text-sm italic
                      ${settings.darkMode ? 'text-slate-600' : 'text-slate-400'}
                  `}>
                      データはまだありません
                  </div>
              ) : (
                  logs.map((log, i) => (
                      <div key={log.id} className={`flex items-center gap-3 p-3 rounded-xl shadow-sm border text-sm animate-in fade-in slide-in-from-bottom-2
                          ${settings.darkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-200' 
                              : 'bg-white border-slate-100 text-slate-800'}
                      `}>
                          <span className="font-mono text-[10px] opacity-50 w-6 text-right">
                              #{i + 1}
                          </span>
                          <span className="font-mono text-xs opacity-50">
                              {log.timestamp.split('T')[1].split('.')[0]}
                          </span>
                          <span className={`font-bold w-12 flex items-center gap-1 ${log.gender === 'Male' ? 'text-blue-500' : 'text-rose-500'}`}>
                              {log.gender === 'Male' ? '♂ 男' : '♀ 女'}
                          </span>
                          <span className={`px-3 py-1 rounded-md text-xs font-bold text-white flex-1 text-center flex items-center justify-center gap-2 ${ACTION_CONFIG[log.action].color}`}>
                              {ACTION_CONFIG[log.action].icon}
                              {ACTION_CONFIG[log.action].label.split(' ')[0]}
                          </span>
                          
                          {/* 階層モデルインジケーター */}
                          <div className="flex flex-col gap-[2px] opacity-40">
                              <div className={`w-1.5 h-1.5 rounded-full ${log.isStop ? 'bg-emerald-500' : settings.darkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
                              <div className={`w-1.5 h-1.5 rounded-full ${log.isUse ? 'bg-pink-500' : settings.darkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
                          </div>
                      </div>
                  ))
              )}
              <div ref={logsEndRef} />
          </div>
      </div>
    </div>
  );
}