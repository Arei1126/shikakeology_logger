import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Play, Square, RotateCcw, Settings, FileText, Trash2, Eye, Footprints, Hand, User, Moon, Sun, Smartphone, Archive, History, CheckCircle, X, Users, Edit3, Volume2, VolumeX, Save, BookOpen, ExternalLink, Share, MoreVertical, Layers, MousePointer2 } from 'lucide-react';

/**
 * Shikakeology Action Logger (PWA-ready) v4.11
 * 仕掛学に基づく行動観察用ロガー
 * * Update v4.11:
 * - 【BugFix】Web Audio APIの実装を修正。AudioContextをシングルトン（単一インスタンス）化し、
 * 再生ごとにインスタンスを生成することで発生するブラウザのリソース制限（音が出なくなる問題）を解決。
 * - ユーザーインタラクション時にAudioContextをresumeする処理を追加し、モバイルブラウザでの自動再生ポリシーに対応。
 */

// --- Type Definitions ---

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
  date: string; // Save Date
  sessionInfo: SessionInfo;
  logs: LogEntry[];
}

interface AppSettings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
}

// --- Configuration ---

const ACTION_CONFIG = {
  Pass: { label: '通行 (Pass)', color: 'bg-slate-400 dark:bg-slate-600', ringColor: '#94a3b8', icon: <User size={24} /> },
  Look: { label: '見た (Look)', color: 'bg-amber-500', ringColor: '#f59e0b', icon: <Eye size={24} /> },
  Stop: { label: '止まった (Stop)', color: 'bg-emerald-600', ringColor: '#059669', icon: <Footprints size={24} /> },
  Use:  { label: '使った (Use)', color: 'bg-pink-600', ringColor: '#db2777', icon: <Hand size={24} /> },
};

// --- Audio Helper (Singleton Pattern) ---
// Global variable to hold the single AudioContext instance
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    return audioCtx;
};

const playTone = (type: 'record' | 'undo' | 'open' | 'delete' | 'success') => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Ensure context is running (required for mobile browsers after user interaction)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.error("Audio resume failed", e));
        }
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'record') {
            // Android-like "Tick" / "Click" (Hard, Short)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.05);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'undo') {
            // "Swoosh" / Reverse feel
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'open') {
            // "Pop" / Soft modal open
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'delete') {
            // Low thud
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'success') {
            // Bright chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(1046.5, now + 0.1); // Octave up
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
        
        // Clean up oscillator node after playing (automatic by GC, but stop is essential)
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

// --- Sub-Components ---

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
            <div className="absolute inset-0 flex items-center justify-center w-48 h-48 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                <div className={`absolute top-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}><Eye size={20} /></div>
                <div className={`absolute bottom-0 flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}><Hand size={20} /></div>
                <div className={`absolute ${isMale ? 'right-0' : 'left-0'} flex flex-col items-center ${isMale ? 'text-blue-200' : 'text-rose-200'}`}>{isMale ? <Footprints size={20} /> : <Footprints size={20} />}</div>
            </div>
        </div>
    );
};

const GuideModal = ({ settings, onClose }: { settings: AppSettings, onClose: () => void }) => {
    const [tab, setTab] = useState<'theory' | 'usage' | 'install'>('theory');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300">
        <div 
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200
            ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}
            `}
            style={{ colorScheme: settings.darkMode ? 'dark' : 'light' }}
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
                <h3 className="text-xl font-bold flex items-center gap-2">
                   仕掛学における関与プロセス
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  本アプリは、仕掛け（Shikake）に対する人々の行動変容を記録するために設計されています。
                  特に、対象への**「関与の深さ（Engagement）」**を以下の4段階のファネル（漏斗）モデルで捉えます。
                </p>

                <div className={`p-4 rounded-xl border ${settings.darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                      <div>
                        <div className="font-bold text-pink-600">使った (Use)</div>
                        <div className="text-xs opacity-70">仕掛けに物理的に接触した、または意図された行動を完遂した状態。最も深い関与。</div>
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
                
                <p className="text-xs opacity-60">
                  ※ 本アプリで上位の行動（例：Use）を記録すると、下位の行動（Stop, Look）も自動的に記録されたものとしてデータ処理されます。
                </p>

                <div className="pt-2 border-t dark:border-slate-700">
                   <a 
                     href="https://www.shikakeology.org/pdf/SIG-TBC-012-03.pdf" 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center gap-2 text-blue-500 text-sm font-bold hover:underline"
                   >
                     <ExternalLink size={14}/> 参考文献: 仕掛学研究会 論文 (PDF)
                   </a>
                </div>
              </div>
            )}

            {tab === 'usage' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="space-y-2">
                    <h3 className="font-bold border-b pb-1 dark:border-slate-600">画面の見方</h3>
                    <p className="text-sm opacity-80">
                        画面は田の字型に4分割されています。対象者の属性に合わせてエリアを長押しします。
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold py-2">
                        <div className="p-3 bg-rose-100 text-rose-800 rounded">♀ 個人 (左上)</div>
                        <div className="p-3 bg-blue-100 text-blue-800 rounded">♂ 個人 (右上)</div>
                        <div className="p-3 bg-rose-200 text-rose-900 rounded">♀ 集団 (左下)</div>
                        <div className="p-3 bg-blue-200 text-blue-900 rounded">♂ 集団 (右下)</div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h3 className="font-bold border-b pb-1 dark:border-slate-600">ジェスチャー操作</h3>
                    <p className="text-sm opacity-80">
                        エリアを押したまま、対象者の行動に合わせて指をスライドさせます。
                    </p>
                    <ul className="text-sm space-y-2 pl-2">
                        <li className="flex items-center gap-2"><span className="font-bold">⬆ 上へ:</span> <span className="bg-amber-100 text-amber-800 px-1 rounded">見た (Look)</span></li>
                        <li className="flex items-center gap-2"><span className="font-bold">⬅➡ 外側へ:</span> <span className="bg-emerald-100 text-emerald-800 px-1 rounded">止まった (Stop)</span></li>
                        <li className="flex items-center gap-2"><span className="font-bold">⬇ 下へ:</span> <span className="bg-pink-100 text-pink-800 px-1 rounded">使った (Use)</span></li>
                        <li className="flex items-center gap-2"><span className="font-bold">指を離す:</span> <span className="bg-slate-100 text-slate-800 px-1 rounded">通行のみ (Pass)</span></li>
                    </ul>
                 </div>
                 
                 <div className="space-y-2">
                    <h3 className="font-bold border-b pb-1 dark:border-slate-600">修正と保存</h3>
                    <p className="text-sm opacity-80">
                        記録ミスは画面下のリストをタップして修正・削除が可能。計測終了後は必ず「保存」を行ってください。CSVとして書き出すことができます。
                    </p>
                 </div>
              </div>
            )}

            {tab === 'install' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`p-4 rounded-xl border-l-4 border-blue-500 ${settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-1">PWA (Progressive Web App)</h3>
                    <p className="text-xs opacity-80">
                        このアプリはブラウザで動作しますが、ホーム画面に追加することで、オフラインでも動くネイティブアプリのように使用できます。
                    </p>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 border-b pb-2 dark:border-slate-600">
                        <span className="text-xl">🍎</span> iOS (iPhone/iPad)
                    </h3>
                    <ol className="list-decimal list-inside text-sm space-y-2 opacity-80">
                        <li>Safariでこのページを開きます。</li>
                        <li className="flex items-center gap-1">画面下部の <Share size={16} className="inline text-blue-500"/> (共有) ボタンをタップ。</li>
                        <li>メニューをスクロールして<span className="font-bold">「ホーム画面に追加」</span>を選択。</li>
                        <li>右上の「追加」をタップして完了！</li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold flex items-center gap-2 border-b pb-2 dark:border-slate-600">
                        <span className="text-xl">🤖</span> Android
                    </h3>
                    <ol className="list-decimal list-inside text-sm space-y-2 opacity-80">
                        <li>Chromeでこのページを開きます。</li>
                        <li className="flex items-center gap-1">右上の <MoreVertical size={16} className="inline"/> (メニュー) ボタンをタップ。</li>
                        <li><span className="font-bold">「アプリをインストール」</span>または「ホーム画面に追加」を選択。</li>
                        <li>確認画面で「インストール」をタップして完了！</li>
                    </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

interface EditModalProps {
    log: LogEntry | undefined;
    settings: AppSettings;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<LogEntry>) => void;
    onDelete: (id: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ log, settings, onClose, onUpdate, onDelete }) => {
    const [localNote, setLocalNote] = useState('');

    useEffect(() => {
        if (log) {
            setLocalNote(log.note || '');
        }
    }, [log]);

    const handleSaveNote = () => {
        if (log && localNote !== log.note) {
            onUpdate(log.id, { note: localNote });
        }
    };

    if (!log) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
            style={{ colorScheme: settings.darkMode ? 'dark' : 'light' }}
        >
            <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200
                ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}
            `}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Edit3 size={20} /> 記録を編集
                    </h3>
                    <button 
                        onClick={() => { handleSaveNote(); onClose(); }} 
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Gender Select */}
                    <div className="flex gap-2">
                        {(['Male', 'Female'] as const).map(g => (
                            <button
                                key={g}
                                onClick={() => onUpdate(log.id, { gender: g })}
                                className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all
                                    ${log.gender === g 
                                        ? (g === 'Male' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-rose-100 border-rose-500 text-rose-700')
                                        : 'border-slate-200 dark:border-slate-600 opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'} 
                                `}
                            >
                                {g === 'Male' ? '♂ 男' : '♀ 女'}
                            </button>
                        ))}
                    </div>

                    {/* Group Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdate(log.id, { isGroup: false })}
                            className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${!log.isGroup ? 'bg-slate-200 border-slate-400 text-slate-800' : 'border-slate-200 dark:border-slate-600 opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}
                            `}
                        >
                            <User size={18} /> 個人
                        </button>
                        <button
                            onClick={() => onUpdate(log.id, { isGroup: true })}
                            className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${log.isGroup ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-slate-200 dark:border-slate-600 opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}
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
                                onClick={() => onUpdate(log.id, { action: act })}
                                className={`py-2 rounded-lg text-xs font-bold border-2 flex flex-col items-center gap-1 transition-colors
                                    ${log.action === act 
                                        ? 'border-slate-800 bg-slate-100 dark:bg-slate-700 dark:border-white opacity-100 ring-2 ring-offset-1 ring-slate-400 text-slate-800 dark:text-slate-100' 
                                        : 'border-transparent bg-slate-50 dark:bg-slate-700 opacity-60 hover:opacity-100 text-slate-600 dark:text-slate-300'}
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
                            value={localNote}
                            onChange={(e) => setLocalNote(e.target.value)}
                            onBlur={handleSaveNote}
                            placeholder="特徴など..."
                            className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                                ${settings.darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}
                            `}
                        />
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => { handleSaveNote(); onClose(); }}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            完了
                        </button>
                        <button 
                            onClick={() => onDelete(log.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                            <Trash2 size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  // --- State ---
  const [isRecording, setIsRecording] = useState(false);
  
  // Modes & Panels
  const [isSetupMode, setIsSetupMode] = useState(false); 
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Modals
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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
      if (savedIsRecording) setIsRecording(false);
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
    
    // Also apply to body to ensure consistent background
    if (settings.darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
    }
  }, [logs, sessionInfo, isRecording, history, settings]);

  useEffect(() => {
    if (!editingLogId) {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, editingLogId]);

  // --- Helper: Feedback ---

  const triggerFeedback = (type: 'record' | 'undo' | 'open' | 'delete' | 'success', hapticPattern?: number | number[]) => {
    if (settings.hapticsEnabled && hapticPattern) {
        try { navigator.vibrate?.(hapticPattern); } catch(e){}
    }
    if (settings.soundEnabled) {
        playTone(type);
    }
  };

  // --- Logic: Session & Recording ---

  const initSession = () => { setIsSetupMode(true); setIsFinishing(false); triggerFeedback('open', 10); };

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
    triggerFeedback('open', [50, 50]);
  };

  const addLog = (gender: Gender, isGroup: boolean, action: ActionType) => {
    if (!isRecording) return;
    triggerFeedback('record', 50);

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
      isGroup,
      action,
      note: '',
      isPass, isLook, isStop, isUse,
    };

    setLogs(prev => [...prev, newLog]);
  };

  const undoLastLog = () => {
    setLogs(prev => prev.slice(0, -1));
    triggerFeedback('undo', 30);
  };

  const openEditModal = (id: string) => {
      setEditingLogId(id);
      triggerFeedback('open', 10);
  };

  const toggleSettings = () => {
      const newState = !isSettingsOpen;
      setIsSettingsOpen(newState);
      if (newState) triggerFeedback('open', 10);
  };

  // --- Logic: Edit & Update ---

  const updateLog = (id: string, updates: Partial<LogEntry>) => {
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
      `# Shikakeology Data Export (v4.10)`,
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

  // Improved filename generation
  const downloadCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo, prefix: string) => {
    if (targetLogs.length === 0) { alert('No Data'); return; }
    
    // 1. Determine base time (Session Start Time or Current Time)
    const baseTime = targetInfo.startTime ? new Date(targetInfo.startTime) : new Date();
    
    // Format: YYYY-MM-DD_HH-mm-ss
    const dateStr = baseTime.getFullYear() + '-' +
        String(baseTime.getMonth() + 1).padStart(2, '0') + '-' +
        String(baseTime.getDate()).padStart(2, '0') + '_' +
        String(baseTime.getHours()).padStart(2, '0') + '-' +
        String(baseTime.getMinutes()).padStart(2, '0') + '-' +
        String(baseTime.getSeconds()).padStart(2, '0');

    // 2. Sanitize Note (First 10 chars, replace unsafe chars)
    let noteStr = '';
    if (targetInfo.note) {
        // Take first 10 chars, replace spaces/slashes/etc with underscore
        const rawNote = targetInfo.note.slice(0, 10);
        noteStr = '_' + rawNote.replace(/[\\/:*?"<>| \n\r]/g, '_');
    }

    const filename = `${prefix}_${dateStr}${noteStr}.csv`;

    const csvContent = generateCSV(targetLogs, targetInfo);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
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

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden touch-none select-none transition-colors duration-300
        ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}
    `}>
      {/* Modals - Rendered at top level to prevent focus loss */}
      <EditModal 
          log={logs.find(l => l.id === editingLogId)}
          settings={settings}
          onClose={() => setEditingLogId(null)}
          onUpdate={updateLog}
          onDelete={deleteLog}
      />
      {isGuideOpen && <GuideModal settings={settings} onClose={() => setIsGuideOpen(false)} />}

      {/* Header - Z-index elevated to 50 */}
      <header className={`px-4 py-2 shadow-sm flex items-center justify-between shrink-0 z-50 h-14 border-b transition-colors duration-300
          ${settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className="flex items-center gap-2">
            <div className="leading-tight">
                <div className={`font-bold text-lg ${settings.darkMode ? 'text-slate-100' : 'text-slate-800'}`}>行動記録ロガー</div>
                <div className={`text-[10px] font-mono tracking-wider ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SHIKAKEOLOGY v4.11</div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {!isRecording && !isSetupMode && !isFinishing && (
                 <button onClick={initSession} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all hover:bg-blue-700">
                    <Play size={18} fill="currentColor" /> 開始
                </button>
            )}
            {isRecording && (
                <button onClick={stopSession} className="flex items-center gap-2 bg-slate-700 text-white px-5 py-2 rounded-full font-bold shadow-md active:scale-95 transition-all animate-pulse dark:bg-slate-600 dark:hover:bg-slate-500 hover:bg-slate-800">
                    <Square size={18} fill="currentColor" /> 終了
                </button>
            )}
            <button 
                onClick={toggleSettings} 
                className={`p-2 rounded-full transition-colors relative ${settings.darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
            >
                <Settings size={22} />
            </button>
        </div>
      </header>

      {/* Settings Panel (Animated) - Fixed position below header (top-14) */}
      <div 
        className={`fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isSettingsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSettingsOpen(false)}
        style={{ colorScheme: settings.darkMode ? 'dark' : 'light' }}
      >
        <div 
            className={`absolute top-0 left-0 w-full p-4 border-b h-full overflow-y-auto transition-transform duration-300 ease-out
              ${settings.darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}
              ${isSettingsOpen ? 'translate-y-0' : '-translate-y-full'}
            `}
            onClick={(e) => e.stopPropagation()} // Prevent close on panel click
        >
            <div className="max-w-md mx-auto space-y-6 pb-20">
              
              {/* Guidebook Button */}
              <button 
                onClick={() => { setIsGuideOpen(true); setIsSettingsOpen(false); triggerFeedback('open', 10); }}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-3 transition-transform active:scale-95
                   ${settings.darkMode 
                      ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white border border-slate-600' 
                      : 'bg-gradient-to-r from-slate-100 to-white text-slate-700 border border-slate-200'}
                `}
              >
                  <BookOpen className="text-blue-500"/>
                  アプリの使い方・背景理論
              </button>

              {/* Settings Controls - Colors explicitly set to prevent OS dark mode conflicts */}
              <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2 border-slate-200 dark:border-slate-700"><Settings size={20}/> 環境設定</h3>
                  
                  {/* Dark Mode */}
                  <div className={`flex justify-between items-center p-3 rounded-lg ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
                      <div className="flex gap-3 items-center"><Moon size={20} className="text-purple-400"/><span>ナイトモード</span></div>
                      <button onClick={() => setSettings(s => ({...s, darkMode: !s.darkMode}))} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-purple-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-6' : ''}`}/>
                      </button>
                  </div>
                  
                  {/* Sound */}
                  <div className={`flex justify-between items-center p-3 rounded-lg ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
                      <div className="flex gap-3 items-center"><Volume2 size={20} className="text-green-500"/><span>操作音 (SE)</span></div>
                      <button onClick={() => setSettings(s => ({...s, soundEnabled: !s.soundEnabled}))} className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-green-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-6' : ''}`}/>
                      </button>
                  </div>
              </div>
              
              {/* History - Colors explicitly set to prevent OS dark mode conflicts */}
              <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2 border-slate-200 dark:border-slate-700"><History size={20}/> 保存済み履歴</h3>
                  {history.length === 0 ? <div className="text-center py-4 text-sm opacity-50">履歴なし</div> : (
                      <div className="space-y-3">
                          {history.map(item => (
                              <div key={item.id} className={`p-3 rounded-lg border ${settings.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                  <div className="flex justify-between mb-2">
                                      <span className="font-bold text-sm">{new Date(item.date).toLocaleString()}</span>
                                      <button onClick={() => deleteHistoryItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                  </div>
                                  <button onClick={() => downloadCSV(item.logs, item.sessionInfo, 'history')} className={`w-full py-2 border rounded text-sm font-bold flex justify-center gap-2 transition-colors ${settings.darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'}`}>
                                      <Download size={14}/> CSV DL
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* Main Input Area (2x2 Grid) */}
      <main className="flex-1 flex relative">
          
        {/* Overlays (Start/Setup/Finish) */}
        {!isRecording && !isSetupMode && !isFinishing && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
                <div className={`p-8 rounded-3xl text-center w-full max-w-sm ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}>
                    <Play size={48} className="mx-auto mb-4 text-blue-500"/>
                    <h2 className="text-2xl font-bold mb-4">準備完了</h2>
                    <button onClick={initSession} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 transition-colors">設定へ進む</button>
                </div>
            </div>
        )}
        {isSetupMode && (
             <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-6 animate-in fade-in duration-300">
                <div 
                    className={`p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}
                    style={{ colorScheme: settings.darkMode ? 'dark' : 'light' }}
                >
                    <div className="flex justify-between mb-4"><h2 className="font-bold text-xl">セッション設定</h2><button onClick={() => setIsSetupMode(false)} className="hover:opacity-60"><X/></button></div>
                    <input 
                        type="text" 
                        placeholder="場所" 
                        className={`w-full p-3 mb-4 border rounded-lg outline-none transition-colors ${settings.darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`} 
                        value={sessionInfo.location} 
                        onChange={e => setSessionInfo({...sessionInfo, location: e.target.value})}
                    />
                    <textarea 
                        placeholder="メモ" 
                        className={`w-full p-3 mb-6 border rounded-lg h-24 resize-none outline-none transition-colors ${settings.darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`} 
                        value={sessionInfo.note} 
                        onChange={e => setSessionInfo({...sessionInfo, note: e.target.value})}
                    />
                    <button onClick={startRecording} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg flex justify-center gap-2 hover:bg-blue-700 transition-colors"><Play/> 記録スタート</button>
                </div>
            </div>
        )}
        {isFinishing && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-6 animate-in fade-in duration-300">
                <div 
                    className={`p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 ${settings.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'}`}
                    style={{ colorScheme: settings.darkMode ? 'dark' : 'light' }}
                >
                    <div className="text-center mb-4"><CheckCircle size={48} className="text-emerald-500 mx-auto mb-2"/><h2 className="font-bold text-xl">終了確認</h2></div>
                    <textarea 
                        className={`w-full p-3 mb-4 border rounded-lg h-20 text-sm resize-none outline-none transition-colors ${settings.darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`} 
                        value={sessionInfo.note} 
                        onChange={e => setSessionInfo({...sessionInfo, note: e.target.value})}
                    />
                    <button onClick={archiveAndResetSession} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg mb-3 flex justify-center gap-2 hover:bg-emerald-700 transition-colors"><Archive/> 保存して終了</button>
                    <div className="flex gap-2">
                        <button onClick={() => setIsRecording(true) || setIsFinishing(false)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${settings.darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>再開</button>
                        <button onClick={() => downloadCSV(logs, sessionInfo, 'temp')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${settings.darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>仮保存</button>
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

        {/* Dynamic Ring Menu Overlay */}
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
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                 <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                 直近の記録 (タップして編集)
              </span>
              <button 
                  onClick={undoLastLog} 
                  disabled={logs.length === 0 || !isRecording} 
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-opacity hover:opacity-100 ${logs.length === 0 || !isRecording ? 'opacity-30' : 'opacity-70'} ${settings.darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
              >
                  <RotateCcw size={14} /> 1つ戻す
              </button>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${settings.darkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
              {logs.length === 0 ? (
                  <div className={`h-full flex flex-col items-center justify-center text-sm italic opacity-40 ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>データはまだありません</div>
              ) : (
                  logs.map((log, i) => (
                      <div 
                        key={log.id} 
                        onClick={() => openEditModal(log.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl shadow-sm border text-xs animate-in fade-in slide-in-from-bottom-2 cursor-pointer active:scale-95 transition-transform
                          ${settings.darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'}
                      `}>
                          {/* 1. Index No. */}
                          <span className={`font-mono font-bold w-6 text-right ${settings.darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              #{i + 1}
                          </span>

                          {/* 2. Time */}
                          <span className="font-mono opacity-50 w-12 text-right tracking-tighter">
                              {new Date(log.unixTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          </span>
                          
                          {/* 3. Gender/Group */}
                          <div className={`flex items-center justify-center gap-0.5 font-bold w-10 ${log.gender === 'Male' ? 'text-blue-500' : 'text-rose-500'}`}>
                             <span className="text-sm">{log.gender === 'Male' ? '♂' : '♀'}</span>
                             {log.isGroup && <Users size={12} className="opacity-70"/>}
                          </div>

                          {/* 4. Action */}
                          <span className={`px-2 py-1 rounded text-[10px] font-bold text-white flex-1 text-center truncate ${ACTION_CONFIG[log.action].color}`}>
                              {ACTION_CONFIG[log.action].label.split(' ')[0]}
                          </span>
                          
                          {/* 5. Note Icon */}
                          <div className="w-4 flex justify-center">
                              {log.note && <FileText size={12} className="opacity-50 text-blue-400" />}
                          </div>
                      </div>
                  ))
              )}
              <div ref={logsEndRef} className="h-10" />
          </div>
      </div>
    </div>
  );
}