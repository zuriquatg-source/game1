import React from 'react';
import { Sparkles, Users, UserPlus, HelpCircle, BookOpen, RotateCcw } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface HomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onOpenRules: () => void;
  onOpenWords: () => void;
  previousRoomCode?: string | null;
  onRejoinRoom?: (code: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onOpenRules,
  onOpenWords,
  previousRoomCode,
  onRejoinRoom,
}) => {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-between min-h-[calc(100vh-80px)] p-5 text-center">
      {/* Top Tag & Decorative Badges */}
      <div className="w-full flex flex-col items-center pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-extrabold tracking-wide mb-3 shadow-inner">
          <span>GHAZAL presents</span>
          <span className="text-lg">🎭</span>
        </div>

        {/* Big Game Title */}
        <div className="relative mb-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 rounded-3xl blur-xl opacity-30 animate-pulse-slow"></div>
          <h1 className="relative text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 drop-shadow-sm tracking-tight py-1">
            المندس
          </h1>
        </div>

        {/* Subtitle & Greeting */}
        <p className="text-lg sm:text-xl font-bold text-rose-400 mb-2 flex items-center justify-center gap-2">
          <span>أهلاً بكم في لعبة غزل</span>
          <span className="text-red-500">❤️</span>
        </p>

        {/* Fun Mystery Phrase */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-amber-300 font-semibold text-sm sm:text-base shadow-md">
          <span>مين رح ينكشف اليوم؟</span>
          <span className="text-lg">👀</span>
        </div>
      </div>

      {/* Center Visual Mask / Spy Illustration */}
      <div className="my-6 relative flex items-center justify-center">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-br from-rose-500/20 via-slate-800/60 to-amber-500/20 border-2 border-slate-700/80 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="text-6xl sm:text-7xl animate-bounce">
            🕵️‍♂️
          </div>
          <span className="text-xs font-bold text-slate-300 mt-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
            لعبة جماعية أونلاين ⚡
          </span>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="w-full space-y-3 pb-4">
        {previousRoomCode && onRejoinRoom && (
          <button
            onClick={() => {
              sound.playClick();
              onRejoinRoom(previousRoomCode);
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-rose-500/30 active:scale-98 text-amber-300 font-black text-base shadow-lg border-2 border-amber-400/60 flex items-center justify-center gap-2.5 transition-all animate-pulse"
          >
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <span>العودة لغرفتك السابقة ({previousRoomCode}) 🔄</span>
          </button>
        )}

        <button
          onClick={() => {
            sound.playClick();
            onCreateRoom();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 active:scale-98 text-white font-black text-lg sm:text-xl shadow-xl shadow-rose-900/30 flex items-center justify-center gap-3 transition-all border border-rose-400/30"
        >
          <UserPlus className="w-6 h-6" />
          <span>إنشاء غرفة جديدة 👑</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onJoinRoom();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-98 text-white font-bold text-lg sm:text-xl shadow-lg border border-slate-700 flex items-center justify-center gap-3 transition-all"
        >
          <Users className="w-6 h-6 text-amber-400" />
          <span>الانضمام إلى غرفة 🚪</span>
        </button>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="py-3 px-4 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-bold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>كيف نلعب؟</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenWords();
            }}
            className="py-3 px-4 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-bold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-rose-400" />
            <span>بنك الكلمات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
