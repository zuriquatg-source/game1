import React, { useState } from 'react';
import { Crown, Play, Users, Copy, Check, Share2, Settings, UserMinus, Mic, MicOff } from 'lucide-react';
import { Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onOpenWords: () => void;
  onKickPlayer?: (targetPlayerId: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  onStartGame,
  onOpenWords,
  onKickPlayer,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    sound.playClick();
    const shareText = `تعالوا العبوا معنا لعبة "المندس" من تقديم GHAZAL 🎭! ادخل كود الغرفة: ${roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'لعبة المندس - GHAZAL',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const canStart = players.length >= 2;

  return (
    <div className="w-full max-w-md mx-auto p-5 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        {/* Room Code Card */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-850 p-5 rounded-3xl border border-slate-700/80 shadow-xl mb-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500"></div>
          <span className="text-xs font-bold text-slate-400 block mb-1">
            كود الغرفة للمشاركة مع الأصدقاء:
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-black text-rose-400 tracking-widest my-2 select-all">
            {roomCode}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all border border-slate-600/60"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-rose-300" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 text-xs sm:text-sm font-bold transition-all border border-rose-500/30"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة مع الأصدقاء</span>
            </button>
          </div>
        </div>

        {/* Players List Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-lg">
              اللاعبون في الغرفة ({players.length})
            </h3>
          </div>

          {isHost && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenWords();
              }}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-rose-400" />
              <span>الكلمات</span>
            </button>
          )}
        </div>

        {/* Players Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 max-h-[38vh] overflow-y-auto pr-1">
          {players.map((p) => {
            const isCurrent = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl w-11 h-11 rounded-xl bg-slate-700/60 flex items-center justify-center border border-slate-600/40">
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm sm:text-base text-white">
                        {p.name}
                      </span>
                      {p.isHost && (
                        <span title="مضيف الغرفة">
                          <Crown className="w-4 h-4 text-amber-400 inline" />
                        </span>
                      )}
                      {p.hasMicEnabled && (
                        <span
                          title={p.isMuted ? 'المايك مكتوم' : 'المايك مفعل'}
                          className={`p-1 rounded-md text-[10px] flex items-center ${
                            p.isMuted
                              ? 'bg-rose-500/20 text-rose-400'
                              : p.isSpeaking
                              ? 'bg-emerald-500/30 text-emerald-300 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {p.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isCurrent ? '(أنت)' : 'لاعب متصل 🟢'}
                    </span>
                  </div>
                </div>

                {isHost && !p.isHost && onKickPlayer && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onKickPlayer(p.id);
                    }}
                    title="طرد اللاعب"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Host Actions or Waiting State */}
      <div className="w-full pt-4 border-t border-slate-800">
        {isHost ? (
          <div className="space-y-2">
            <button
              onClick={() => {
                sound.playStart();
                onStartGame();
              }}
              disabled={!canStart}
              className={`w-full py-4 px-6 rounded-2xl font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-98 ${
                canStart
                  ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-900/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              <span>ابدأ اللعبة 🎮</span>
            </button>
            {!canStart && (
              <p className="text-center text-xs text-amber-400 font-medium animate-pulse">
                بانتظار انضمام لاعب آخر على الأقل لبدء اللعبة... ⏳
              </p>
            )}
          </div>
        ) : (
          <div className="text-center p-4 bg-slate-850 border border-slate-700/60 rounded-2xl">
            <div className="inline-block animate-spin text-2xl mb-1">⏳</div>
            <p className="font-bold text-sm text-slate-200">
              بانتظار المضيف ليبدأ اللعبة...
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              استعدوا لكشف المندس! 👀
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
