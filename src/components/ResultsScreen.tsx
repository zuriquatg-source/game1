import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Users, Award, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Player, VotingSummary, ImposterGuess } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface ResultsScreenProps {
  votingSummary: VotingSummary | null;
  actualImposter: Player | null;
  secretWord: string | null;
  imposterGuess: ImposterGuess | null;
  roundWinner: 'imposter' | 'players' | null;
  players: Player[];
  isHost: boolean;
  onProceedToLeaderboard: () => void;
  onNextRound?: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  votingSummary,
  actualImposter,
  secretWord,
  imposterGuess,
  roundWinner,
  players,
  isHost,
  onProceedToLeaderboard,
  onNextRound,
}) => {
  useEffect(() => {
    if (votingSummary?.imposterCaught) {
      sound.playMundassCaughtGhazal(actualImposter?.name);
    } else {
      sound.playWin();
    }
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  }, [votingSummary?.imposterCaught, actualImposter?.name]);

  const mostVotedPlayer = votingSummary?.mostVotedId
    ? players.find((p) => p.id === votingSummary.mostVotedId)
    : null;

  return (
    <div className="w-full max-w-md mx-auto p-5 min-h-[calc(100vh-80px)] flex flex-col justify-between text-center">
      <div>
        {/* Custom Caught Ghazal Fun Banner */}
        {votingSummary?.imposterCaught && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-amber-500/25 via-rose-500/30 to-amber-500/25 border-2 border-amber-400/80 rounded-3xl shadow-xl shadow-amber-950/40 animate-in zoom-in-95 duration-300">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-md mb-1">
              مسكتك غزل! 😂🎯
            </div>
            <p className="text-xs text-amber-100 font-bold mb-2">
              تم كشف المندس بالجرم المشهود وانفضحت خطته!
            </p>
            <button
              type="button"
              onClick={() => sound.playMundassCaughtGhazal(actualImposter?.name)}
              className="px-3 py-1 bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 text-[11px] font-black rounded-xl border border-amber-400/50 transition-all cursor-pointer"
            >
              🔊 أعد تشغيل الصوت: «مسكتك غزل!» 😂
            </button>
          </div>
        )}

        {/* Excitement Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black mb-3">
          <span>مين رح يفوز بالجولة؟ 🔥</span>
        </div>

        {/* Round Winner Announcement */}
        <div className="mb-5">
          {roundWinner === 'imposter' ? (
            <div className="p-5 rounded-3xl bg-gradient-to-b from-rose-900/60 via-slate-900 to-slate-900 border-2 border-rose-500 shadow-2xl">
              <div className="text-5xl mb-2">😈🏆</div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-400">
                فاز المندس بالجولة!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {imposterGuess?.isCorrect
                  ? 'انكشف المندس بالتصويت لكنه خمن الكلمة بنجاح وفاز! (+80 نقطة)'
                  : 'لم يستطع اللاعبون كشف المندس ففاز بالدهاء! (+100 نقطة)'}
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-900/60 via-slate-900 to-slate-900 border-2 border-emerald-500 shadow-2xl">
              <div className="text-5xl mb-2">🎉🏆</div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400">
                فاز المواطنون الشرفاء!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                تم كشف المندس ولم يستطع تخمين الكلمة السرية! (+50 نقطة لكل مواطن)
              </p>
            </div>
          )}
        </div>

        {/* Secret Word & Real Imposter Details */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-right">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              الكلمة السرية كانت:
            </span>
            <span className="text-base font-black text-amber-400">
              {secretWord || 'غير محدد'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-right">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              المندس الحقيقي كان:
            </span>
            <div className="flex items-center gap-1.5 font-black text-rose-400 text-sm">
              <span>{actualImposter?.avatar}</span>
              <span>{actualImposter?.name}</span>
            </div>
          </div>
        </div>

        {/* Imposter Guess Breakdown (if occurred) */}
        {imposterGuess && (
          <div className="p-3.5 bg-slate-850 rounded-2xl border border-slate-700 mb-5 text-right flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block">
                تخمين المندس الأخير:
              </span>
              <span className="text-sm font-extrabold text-white">
                "{imposterGuess.guessedWord}"
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {imposterGuess.isCorrect ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>تخمين صحيح!</span>
                </span>
              ) : (
                <span className="text-rose-400 text-xs font-bold flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  <span>تخمين خاطئ!</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Voting Breakdown */}
        <div className="bg-slate-850 p-4 rounded-3xl border border-slate-700/80 mb-4 text-right">
          <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>تفاصيل أصوات اللاعبين:</span>
          </h4>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {players.map((p) => {
              const votes = votingSummary?.voteCounts[p.id] || 0;
              const isHighest = votingSummary?.mostVotedId === p.id;
              const isImposter = actualImposter?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    isHighest
                      ? 'bg-rose-500/15 border-rose-500/40 text-white'
                      : 'bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.avatar}</span>
                    <span>{p.name}</span>
                    {isImposter && (
                      <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        المندس
                      </span>
                    )}
                  </div>
                  <span className="bg-slate-700/70 px-2 py-1 rounded-lg text-amber-300">
                    {votes} {votes === 1 ? 'صوت' : 'أصوات'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full pt-4 border-t border-slate-800 space-y-2.5">
        {isHost && onNextRound ? (
          <>
            <button
              onClick={() => {
                sound.playStart();
                onNextRound();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 active:scale-98 text-white font-black text-lg shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>بدء جولة جديدة مباشرة 🎮</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onProceedToLeaderboard();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>عرض لوحة المتصدرين 🏆</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                sound.playClick();
                onProceedToLeaderboard();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white font-black text-base sm:text-lg shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trophy className="w-5 h-5" />
              <span>عرض لوحة المتصدرين والنتائج 🏆</span>
            </button>

            <div className="p-3 bg-slate-850 rounded-2xl border border-slate-700/60 text-center text-xs text-slate-300 font-bold flex items-center justify-center gap-2">
              <span className="animate-spin text-base">⏳</span>
              <span>نحن في نفس الغرفة! بانتظار المضيف لبدء جولة جديدة بالكلمة القادمة 🎮</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
