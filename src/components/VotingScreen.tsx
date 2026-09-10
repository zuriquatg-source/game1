import React, { useState } from 'react';
import { Vote, CheckCircle2, ShieldAlert, Users, Sparkles, Mic, MicOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Player, ClueItem } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface VotingScreenProps {
  players: Player[];
  clues?: ClueItem[];
  currentPlayerId: string;
  isHost: boolean;
  secretWord: string | null;
  onVote: (targetPlayerId: string) => void;
  onForceFinishVoting: () => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({
  players,
  clues = [],
  currentPlayerId,
  isHost,
  secretWord,
  onVote,
  onForceFinishVoting,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [expandedCluesPlayerId, setExpandedCluesPlayerId] = useState<string | null>(null);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const hasVoted = Boolean(currentPlayer?.hasVoted);
  const votedCount = players.filter((p) => p.hasVoted).length;

  const handleSelectVote = (targetId: string) => {
    if (hasVoted) return;
    sound.playClick();
    setSelectedTargetId(targetId);
  };

  const handleConfirmVote = () => {
    if (!selectedTargetId || hasVoted) return;
    sound.playCaught();
    onVote(selectedTargetId);
  };

  return (
    <div id="voting-screen" className="w-full max-w-md mx-auto p-4 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        {/* Secret Word Display for Citizens (Crucial User Requirement) */}
        {secretWord ? (
          <div className="p-3 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-bold text-center mb-3 shadow-md flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>الكلمة السرية للعبة: <strong className="text-white text-base font-black underline underline-offset-2">« {secretWord} »</strong> 🤫</span>
          </div>
        ) : (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-black text-center mb-3">
            🕵️ أنت المندس! لا تفضح نفسك أثناء التصويت وصوّت كأنك مواطن عادي!
          </div>
        )}

        {/* Playful phrases */}
        <div className="space-y-1 mb-3 text-center">
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-sm font-black shadow-md">
            وقت التصويت! لا تثقوا بأحد 😈
          </div>
          <div className="text-[11px] text-amber-300 font-bold">
            مين تلميحاته مش منطقية وشايفينه بريء زيادة عن اللزوم؟ 😂
          </div>
        </div>

        {/* Voting progress */}
        <div className="flex items-center justify-between px-1 mb-2.5 text-xs text-slate-300 font-bold">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-rose-400" />
            <span>صوّت {votedCount} من {players.length} لاعبين</span>
          </div>
          {hasVoted && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تم تسجيل صوتك</span>
            </span>
          )}
        </div>

        {/* Players Grid for voting */}
        <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1 mb-3">
          {players.map((p) => {
            const isSelf = p.id === currentPlayerId;
            const isSelected = selectedTargetId === p.id;
            const playerClues = clues.filter((c) => c.playerId === p.id);
            const isExpanded = expandedCluesPlayerId === p.id;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border transition-all select-none relative ${
                  isSelf
                    ? 'bg-slate-800/40 border-slate-800 opacity-60'
                    : hasVoted
                    ? 'bg-slate-800/80 border-slate-700/60'
                    : isSelected
                    ? 'bg-rose-500/25 border-2 border-rose-500 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-800/90 border-slate-700 hover:border-rose-500/50'
                }`}
              >
                <div
                  onClick={() => {
                    if (!isSelf && !hasVoted) {
                      handleSelectVote(p.id);
                    }
                  }}
                  className={`flex items-center justify-between ${!isSelf && !hasVoted ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl w-11 h-11 rounded-xl bg-slate-750 flex items-center justify-center border border-slate-650">
                      {p.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white">
                          {p.name}
                        </span>
                        {p.hasMicEnabled && (
                          <span
                            title={p.isMuted ? 'المايك مكتوم' : 'المايك يعمل'}
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
                      <span className="text-[11px] text-slate-400">
                        {isSelf ? '(أنت - لا تصوّت لنفسك!)' : 'مشتبه به 🕵️'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View clues toggle */}
                    {playerClues.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          setExpandedCluesPlayerId(isExpanded ? null : p.id);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-amber-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>التلميحات ({playerClues.length})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {!isSelf && !hasVoted && (
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-slate-500 bg-slate-700/50'
                        }`}
                      >
                        {isSelected && <span className="text-xs font-bold">✓</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded clues list for this player */}
                {isExpanded && playerClues.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-750 space-y-1">
                    {playerClues.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-lg text-xs text-slate-200 border border-slate-800">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          #{i + 1}
                        </span>
                        <span className="font-medium text-white break-words">"{c.clueText}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation button or Waiting state */}
      <div className="w-full pt-3 border-t border-slate-800">
        {!hasVoted ? (
          <button
            onClick={handleConfirmVote}
            disabled={!selectedTargetId}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 disabled:opacity-40 text-white font-black text-base shadow-xl shadow-rose-950/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Vote className="w-5 h-5" />
            <span>تأكيد التصويت على المندس 🎯</span>
          </button>
        ) : (
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-850 rounded-2xl border border-slate-700 text-center text-xs text-slate-300 font-bold">
              <span className="text-base block mb-0.5">⏳</span>
              بانتظار تصويت باقي اللاعبين لكشف هوية المندس...
            </div>

            {isHost && (
              <button
                onClick={() => {
                  sound.playClick();
                  onForceFinishVoting();
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                إنهاء التصويت وعرض النتائج الآن (للمضيف)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
