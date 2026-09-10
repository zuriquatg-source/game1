import React from 'react';
import { Sparkles, HelpCircle, Volume2, VolumeX, LogOut, Copy, Check } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface HeaderProps {
  roomCode?: string;
  onOpenRules: () => void;
  onLeaveRoom?: () => void;
  isHost?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  onOpenRules,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-rose-500/20">
            🎭
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 tracking-wider">
              <span>GHAZAL presents</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white leading-none">
              المندس
            </h1>
          </div>
        </div>

        {/* Room badge & actions */}
        <div className="flex items-center gap-2">
          {roomCode && (
            <button
              onClick={handleCopyCode}
              title="انقر لنسخ كود الغرفة"
              className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
            >
              <span>كود: {roomCode}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-rose-400" />}
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="طريقة اللعب"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </button>

          {onLeaveRoom && (
            <button
              onClick={() => {
                sound.playClick();
                if (confirm('هل أنت متأكد من رغبتك بمغادرة الغرفة؟')) {
                  onLeaveRoom();
                }
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors"
              title="مغادرة الغرفة"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
