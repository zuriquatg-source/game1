import React, { useState } from 'react';
import { HelpCircle, Send, Sparkles, AlertOctagon } from 'lucide-react';
import { Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface ImposterGuessScreenProps {
  isImposter: boolean;
  actualImposter: Player | null;
  onSubmitGuess: (guess: string) => void;
}

export const ImposterGuessScreen: React.FC<ImposterGuessScreenProps> = ({
  isImposter,
  actualImposter,
  onSubmitGuess,
}) => {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    sound.playClick();
    onSubmitGuess(guess.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 min-h-[calc(100vh-80px)] flex flex-col justify-between text-center">
      <div>
        {/* Shock Badge */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-4xl shadow-xl shadow-rose-950/60 mb-4 animate-bounce">
          😱
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-rose-400 mb-2">
          المندس انكشف!
        </h2>

        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-300 text-sm font-extrabold mb-6 shadow-sm">
          عنده فرصة أخيرة يخمّن الكلمة! 👀
        </div>

        {isImposter ? (
          /* Imposter Interactive Guess Form */
          <div className="bg-slate-850 p-6 rounded-3xl border-2 border-rose-500/60 shadow-2xl text-right">
            <div className="flex items-center gap-2 mb-3 text-rose-300 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <span>فرصتك الذهبية للفوز:</span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
              تم اكتشافك بالتصويت، لكن إذا خمنت الكلمة السرية التي كان يتحدث عنها الجميع، <strong>ستفوز أنت بالجولة رغم اكتشافك</strong>!
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                ما هي الكلمة السرية برأيك؟
              </label>
              <input
                type="text"
                required
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="اكتب تخمينك هنا (مثال: قهوة، قطار...)"
                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!guess.trim()}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-40 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-rose-950/40 active:scale-98 transition-all"
              >
                <Send className="w-5 h-5" />
                <span>إرسال التخمين النهائي 🎯</span>
              </button>
            </form>
          </div>
        ) : (
          /* Waiting Screen for other players */
          <div className="bg-slate-850 p-6 rounded-3xl border border-slate-700/80 shadow-xl space-y-4">
            <div className="text-5xl">⏳</div>
            <h3 className="text-lg font-black text-white">
              المندس يحاول تخمين الكلمة السرية...
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              إذا خمنها صحيحة فسيفوز بالجولة! وإذا أخطأ فأنتم الفائزون! 🔥
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 pt-6">
        مين رح يفوز بالجولة؟ 🔥
      </div>
    </div>
  );
};
