import React, { useState } from 'react';
import { ArrowRight, LogIn, Hash } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker.tsx';
import { sound } from '../utils/audio.ts';

interface JoinRoomScreenProps {
  onBack: () => void;
  onSubmit: (roomCode: string, name: string, avatar: string) => void;
  initialCode?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  onBack,
  onSubmit,
  initialCode = '',
  isLoading,
  errorMessage,
}) => {
  const [roomCode, setRoomCode] = useState(() => initialCode || localStorage.getItem('al_mundass_room_code') || '');
  const [name, setName] = useState(() => localStorage.getItem('al_mundass_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('al_mundass_avatar') || '🦊');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;
    localStorage.setItem('al_mundass_name', name.trim());
    localStorage.setItem('al_mundass_avatar', avatar);
    localStorage.setItem('al_mundass_room_code', roomCode.trim().toUpperCase());
    sound.playClick();
    onSubmit(roomCode.trim().toUpperCase(), name.trim(), avatar);
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 min-h-[calc(100vh-80px)] flex flex-col justify-between">
      <div>
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm font-semibold p-1"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للرئيسية</span>
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
            <LogIn className="w-3.5 h-3.5" />
            <span>الانضمام إلى أصدقائك</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            دخول غرفة
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            أدخل كود الغرفة الذي شاركه معك المضيف لتلعبوا معاً!
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl text-rose-300 text-sm font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              كود الغرفة (Room Code):
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={8}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="مثال: A7B2"
                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-3.5 text-center text-xl font-mono tracking-widest text-white uppercase placeholder-slate-500 focus:outline-none transition-colors"
              />
              <Hash className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              اسمك في اللعبة:
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: يوسف، ريم، كريم..."
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <AvatarPicker selectedAvatar={avatar} onSelectAvatar={setAvatar} />

          <button
            type="submit"
            disabled={!roomCode.trim() || !name.trim() || isLoading}
            className="w-full mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-black text-lg shadow-xl shadow-emerald-950/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>{isLoading ? 'جاري الانضمام...' : 'دخول الغرفة 🎯'}</span>
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-500 pt-6 pb-2">
        اطلب من صديقك كود الغرفة لتنضم إليهم فوراً!
      </div>
    </div>
  );
};
