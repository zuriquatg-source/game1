import React from 'react';
import { Trophy, Medal, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface LeaderboardScreenProps {
  players: Player[];
  isHost: boolean;
  roundNumber: number;
  onNextRound: () => void;
  onReturnToLobby: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  players,
  isHost,
  roundNumber,
  onNextRound,
  onReturnToLobby,
}) => {
  // Sort players by score descending, then by wins
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wins - a.wins;
  });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-xl">🥇</span>;
      case 2:
        return <span className="text-xl">🥈</span>;
      case 3:
        return <span className="text-xl">🥉</span>;
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>لوحة الشرف والمتصدرين</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            نتائج بعد {roundNumber} {roundNumber === 1 ? 'جولة' : 'جولات'}
          </h2>
        </div>

        {/* Players Rank Cards */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 mb-4">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;

            return (
              <div
                key={player.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-500/20 via-slate-800 to-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/30'
                    : 'bg-slate-800/80 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7">
                    {getRankBadge(rank)}
                  </div>
                  <div className="text-3xl w-11 h-11 rounded-xl bg-slate-700/70 flex items-center justify-center border border-slate-600/40">
                    {player.avatar}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm sm:text-base text-white block">
                      {player.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {player.wins} {player.wins === 1 ? 'فوز' : 'انتصارات'} 🏆
                    </span>
                  </div>
                </div>

                <div className="text-left bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                  <span className="text-base font-black text-amber-400 block leading-tight">
                    {player.score}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    نقطة
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Points explanation helper */}
        <div className="p-3 bg-slate-850 rounded-2xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-300">نظام النقاط:</div>
          <div>• مندس لم ينكشف: +100 نقطة</div>
          <div>• مندس اكتُشف لكن خمّن الكلمة: +80 نقطة</div>
          <div>• مواطنون كشفوا المندس: +50 نقطة لكل منهم</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full pt-4 border-t border-slate-800 space-y-2.5">
        {isHost ? (
          <>
            <button
              onClick={() => {
                sound.playStart();
                onNextRound();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 active:scale-98 text-white font-black text-lg shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>جولة جديدة 🎮</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onReturnToLobby();
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>العودة للوبي (مع نفس اللاعبين) 🏠</span>
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="p-3.5 bg-slate-850 rounded-2xl border border-slate-700 text-center text-xs text-slate-300 font-bold flex items-center justify-center gap-2">
              <span className="animate-spin text-base">⏳</span>
              <span>بانتظار المضيف لبدء جولة جديدة أو العودة للوبي...</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onReturnToLobby();
              }}
              className="w-full py-2 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <span>مغادرة الغرفة والعودة للرئيسية</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
