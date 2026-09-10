import React, { useState } from 'react';
import { Eye, EyeOff, MessageSquare, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface GameRoundScreenProps {
  isImposter: boolean;
  secretWord: string | null;
  roundNumber: number;
  isHost: boolean;
  onProceedToClues: () => void;
}

export const GameRoundScreen: React.FC<GameRoundScreenProps> = ({
  isImposter,
  secretWord,
  roundNumber,
  isHost,
  onProceedToClues,
}) => {
  const [isRevealed, setIsRevealed] = useState(true);

  return (
    <div className="w-full max-w-md mx-auto p-5 min-h-[calc(100vh-80px)] flex flex-col justify-between text-center">
      <div>
        {/* Round Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>الجولة رقم {roundNumber}</span>
        </div>

        {/* Fun phrase */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm font-extrabold mb-6 shadow-sm">
          شدّوا حيلكم… في واحد بينكم ما بعرف الكلمة 👀
        </div>

        {/* Secret Card / Role Container */}
        {isImposter ? (
          /* The Imposter Card */
          <div className="bg-gradient-to-b from-rose-950 via-slate-900 to-rose-950 p-6 sm:p-8 rounded-3xl border-2 border-rose-500/80 shadow-2xl shadow-rose-950/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>
            
            <div className="text-6xl sm:text-7xl mb-3 animate-bounce">
              😈
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-rose-400 mb-2">
              أنت المندس!
            </h2>

            <p className="text-base sm:text-lg font-bold text-white mb-4">
              حاول تمثّل إنك عارف الكلمة!
            </p>

            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs sm:text-sm text-rose-200 text-right leading-relaxed font-medium">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>مهمتك السرية:</span>
              </div>
              الكلمة السرية مخفية عنك! استمع لتلميحات الآخرين بذكاء، أعطِ تلميحاً عاماً ومقنعاً، ولا تدع أحداً يشك فيك!
            </div>
          </div>
        ) : (
          /* Regular Player Card */
          <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>

            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>أنت مواطن شريف</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mb-2">
              الكلمة السرية هي:
            </p>

            {/* Tap to hide/reveal secret word for anti-peeking */}
            <div className="relative my-4">
              <div className="p-5 bg-slate-800/90 border-2 border-emerald-500/40 rounded-2xl shadow-inner flex flex-col items-center justify-center">
                {isRevealed ? (
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-wide">
                    {secretWord || '...'}
                  </div>
                ) : (
                  <div className="text-xl font-mono text-slate-500 tracking-widest py-1">
                    ••••••••••
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsRevealed(!isRevealed);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>إخفاء الكلمة لمنع التلصص</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إظهار الكلمة السرية</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              جميع اللاعبين يعرفون هذه الكلمة ما عدا المندس! لا تذكر الكلمة صريحة في تلميحك.
            </p>
          </div>
        )}
      </div>

      {/* Footer Host Action / Waiting Note */}
      <div className="w-full pt-6 border-t border-slate-800">
        {isHost ? (
          <button
            onClick={() => {
              sound.playClick();
              onProceedToClues();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 active:scale-98 text-white font-black text-lg shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span>الانتقال لمرحلة التلميحات 💬</span>
          </button>
        ) : (
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs sm:text-sm text-slate-300">
            احفظ دورك جيداً… المضيف سينقلكم لمرحلة التلميحات الآن! ⏳
          </div>
        )}
      </div>
    </div>
  );
};
