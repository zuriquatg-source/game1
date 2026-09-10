import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Eye, EyeOff, ShieldAlert, Sparkles, Mic } from 'lucide-react';
import { ClueItem, Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface CluesScreenProps {
  clues: ClueItem[];
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  secretWord: string | null;
  onSubmitClue: (clue: string) => void;
  onProceedToVoting: () => void;
  onProceedToDiscussion?: () => void;
  errorMessage?: string | null;
}

export const CluesScreen: React.FC<CluesScreenProps> = ({
  clues,
  players,
  currentPlayerId,
  isHost,
  secretWord,
  onSubmitClue,
  onProceedToVoting,
  onProceedToDiscussion,
  errorMessage,
}) => {
  const [clueText, setClueText] = useState('');
  const [showAuthors, setShowAuthors] = useState(true);

  const myClues = clues.filter((c) => c.playerId === currentPlayerId);
  const myCluesCount = myClues.length;
  const hasFinishedAllClues = myCluesCount >= 3;
  const currentClueNumber = Math.min(3, myCluesCount + 1);

  const totalPossibleClues = players.length * 3;
  const totalSubmittedClues = clues.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueText.trim() || hasFinishedAllClues) return;
    sound.playClueSubmit();
    onSubmitClue(clueText.trim());
    setClueText('');
  };

  const handleProceed = () => {
    sound.playClick();
    if (onProceedToDiscussion) {
      onProceedToDiscussion();
    } else {
      onProceedToVoting();
    }
  };

  return (
    <div id="clues-screen" className="w-full max-w-md mx-auto p-4 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        {/* Secret Word Display for Citizens (Crucial User Requirement) */}
        {secretWord ? (
          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-3 mb-3 text-center shadow-md">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold mb-0.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>الكلمة السرية (تذكير خاص حتى لا تنساها):</span>
            </div>
            <div className="text-xl font-black text-white tracking-wider text-emerald-100">
              « {secretWord} » 🤫
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-black text-center mb-3">
            🕵️ أنت المندس! لا تعرف الكلمة... أعطِ 3 تلميحات ذكية ومقنعة تبعد الشبهة عنك!
          </div>
        )}

        {/* Top Fun Phrase */}
        <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-black text-center mb-3">
          💡 كل لاعب يدخل 3 تلميحات، وبعدها نبدأ نقاش 30 ثانية ثم التصويت!
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <span>إجمالي التلميحات ({totalSubmittedClues} من {totalPossibleClues})</span>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowAuthors(!showAuthors);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            {showAuthors ? (
              <>
                <EyeOff className="w-3 h-3 text-amber-400" />
                <span>إخفاء الأسماء</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>إظهار الأسماء</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Clue Input Form */}
        {!hasFinishedAllClues ? (
          <div className="bg-slate-850 p-4 rounded-3xl border border-slate-700/80 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                أدخل تلميحك رقم <span className="text-amber-400 font-black">({currentClueNumber} من 3)</span>:
              </label>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                {myCluesCount} / 3 منجز
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                type="text"
                required
                maxLength={45}
                value={clueText}
                onChange={(e) => setClueText(e.target.value)}
                placeholder={
                  currentClueNumber === 1
                    ? "التلميح الأول (مثال: لونه أحمر، أو ملمسه ناعم...)"
                    : currentClueNumber === 2
                    ? "التلميح الثاني (مثال: نستخدمه في المساء...)"
                    : "التلميح الثالث والأخير (تلميح حاسم ذكي!)"
                }
                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!clueText.trim()}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التلميح ({currentClueNumber} من 3) 🚀</span>
              </button>
            </form>

            {/* My Previously Submitted Clues */}
            {myCluesCount > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-750">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  تلميحاتك المسجلة حتى الآن:
                </span>
                <div className="space-y-1">
                  {myClues.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-black text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
                        #{idx + 1}
                      </span>
                      <span>{c.clueText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl mb-4 shadow-sm">
            <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-bold mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>أحسنت! أرسلت جميع تلميحاتك الـ 3 بنجاح 🎉</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
              بانتظار باقي اللاعبين لإكمال تلميحاتهم الـ 3 ثم سننتقل تلقائياً للنقاش الصوتي (30 ثانية) 🎙️
            </p>
            <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block">تلميحاتك الثلاثة:</span>
              {myClues.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-emerald-200">
                  <span className="text-[10px] font-black text-amber-300">#{idx + 1}</span>
                  <span>{c.clueText}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clues Live Board */}
        <div className="space-y-2 max-h-[34vh] overflow-y-auto pr-1">
          {clues.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-medium bg-slate-850/50 rounded-2xl border border-dashed border-slate-800">
              بانتظار وصول أول تلميح... 👀
            </div>
          ) : (
            clues.map((clue, idx) => (
              <div
                key={clue.playerId + '_' + idx}
                className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700/70 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-lg shrink-0">
                    {showAuthors ? clue.playerAvatar : '🕵️'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {showAuthors ? (
                        <span className="text-[11px] font-bold text-slate-400 truncate">
                          {clue.playerName}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-400/90">
                          لاعب مجهول
                        </span>
                      )}
                      {clue.clueNumber && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-700 text-amber-300">
                          تلميح {clue.clueNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-white block truncate">
                      "{clue.clueText}"
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer / Move to Discussion */}
      <div className="w-full pt-3 border-t border-slate-800 mt-3">
        {isHost ? (
          <button
            onClick={handleProceed}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white font-black text-sm sm:text-base shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>الانتقال للنقاش الصوتي (30 ثانية) 🗣️</span>
          </button>
        ) : (
          <p className="text-center text-xs text-slate-400 font-medium">
            بعد أن يُدخل الجميع 3 تلميحات، سيبدأ نقاش صوتي لمدة 30 ثانية ثم التصويت! 🎙️
          </p>
        )}
      </div>
    </div>
  );
};
