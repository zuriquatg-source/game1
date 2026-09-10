import React, { useState, useEffect, useRef } from 'react';
import { Users, Vote, Clock, Mic, Sparkles, AlertCircle } from 'lucide-react';
import { ClueItem, Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface DiscussionScreenProps {
  players: Player[];
  clues: ClueItem[];
  currentPlayerId: string;
  isHost: boolean;
  secretWord: string | null;
  secondsLeft?: number;
  onProceedToVoting: () => void;
}

export const DiscussionScreen: React.FC<DiscussionScreenProps> = ({
  players,
  clues,
  currentPlayerId,
  isHost,
  secretWord,
  secondsLeft = 30,
  onProceedToVoting,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(secondsLeft);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(secondsLeft);
  }, [secondsLeft]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (isHost) {
            onProceedToVoting();
          }
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, onProceedToVoting]);

  // Group clues by player
  const cluesByPlayer = players.map((player) => {
    const playerClues = clues.filter((c) => c.playerId === player.id);
    return {
      player,
      clues: playerClues,
    };
  });

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));

  return (
    <div id="discussion-screen" className="w-full max-w-md mx-auto p-4 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        {/* Header Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/30 mb-2">
            <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>وقت التحقيق والنقاش الصوتي 🗣️</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            من هو المندس بينكم؟ 👀
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            استجوبوا بعضكم، قارنوا التلميحات الثلاثة واكتشفوا من يراوغ!
          </p>
        </div>

        {/* 30-Second Countdown Timer Bar */}
        <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-700/80 mb-4 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
              <span>متبقي على بدء التصويت:</span>
            </div>
            <span className={`text-lg font-black px-2.5 py-0.5 rounded-lg ${timeLeft <= 5 ? 'bg-rose-500/30 text-rose-300 animate-pulse' : 'bg-slate-800 text-amber-300'}`}>
              {timeLeft} ثانية
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-750">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                timeLeft <= 5
                  ? 'bg-rose-500'
                  : timeLeft <= 15
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Secret Word Display for Citizens (Crucial User Requirement) */}
        {secretWord ? (
          <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl p-3.5 mb-4 text-center shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>الكلمة السرية للجميع (تذكير خاص حتى لا تنساها):</span>
            </div>
            <div className="text-2xl font-black text-white tracking-wider text-emerald-100">
              « {secretWord} »
            </div>
            <div className="text-[11px] text-emerald-400/80 font-medium mt-1">
              قارن هذه الكلمة مع تلميحات باقي اللاعبين لمعرفة من لا يعرفها!
            </div>
          </div>
        ) : (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3 mb-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-300 font-bold mb-0.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>أنت المندس! 🕵️‍♂️ الكلمة مجهولة بالنسبة لك!</span>
            </div>
            <div className="text-[11px] text-slate-300">
              ادّعِ بثقة أنك تعرف الكلمة ووجّه الشبهات نحو شخص آخر بالصوت!
            </div>
          </div>
        )}

        {/* Player Clues Comparison Grid */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>سجل التلميحات الثلاثة لكل لاعب ({players.length}):</span>
            </span>
          </div>

          <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
            {cluesByPlayer.map(({ player, clues: pClues }) => {
              const isCurrent = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-800/90 border-amber-500/40 shadow-sm'
                      : 'bg-slate-850/90 border-slate-750'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-750 flex items-center justify-center text-lg relative">
                        {player.avatar}
                        {player.isSpeaking && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {player.name} {isCurrent && '(أنت)'}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                      {pClues.length} من 3 تلميحات
                    </span>
                  </div>

                  {/* 3 Clues Pill List */}
                  <div className="space-y-1.5 pl-2">
                    {pClues.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic block py-1">
                        لم يرسل أي تلميح
                      </span>
                    ) : (
                      pClues.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 bg-slate-900/70 p-2 rounded-xl text-xs border border-slate-800"
                        >
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                            #{i + 1}
                          </span>
                          <span className="text-slate-200 font-medium break-words leading-relaxed">
                            {c.clueText}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Host Controls */}
      <div className="w-full pt-3 border-t border-slate-800 space-y-2">
        {isHost ? (
          <button
            onClick={() => {
              sound.playClick();
              onProceedToVoting();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Vote className="w-4 h-4" />
            <span>بدء التصويت الآن 🗳️ (تخطي العداد)</span>
          </button>
        ) : (
          <div className="p-3 bg-slate-850 rounded-2xl border border-slate-750 text-center text-xs text-slate-300 font-bold flex items-center justify-center gap-2">
            <span className="animate-spin text-base">⏳</span>
            <span>استمروا بالنقاش الصوتي! سيبدأ التصويت تلقائياً بعد انتهاء العداد 🎙️</span>
          </div>
        )}
      </div>
    </div>
  );
};
