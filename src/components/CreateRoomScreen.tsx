import React, { useState } from 'react';
import { ArrowRight, Sparkles, Crown } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker.tsx';
import { sound } from '../utils/audio.ts';

interface CreateRoomScreenProps {
  onBack: () => void;
  onSubmit: (name: string, avatar: string) => void;
  isLoading?: boolean;
}

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  onBack,
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState(() => localStorage.getItem('al_mundass_name') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('al_mundass_avatar') || '👑');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem('al_mundass_name', name.trim());
    localStorage.setItem('al_mundass_avatar', avatar);
    sound.playClick();
    onSubmit(name.trim(), avatar);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>مضيف الغرفة (Host)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            إنشاء غرفة جديدة
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            أدخل اسمك واختر بطاقتك الشخصية لمشاركة الكود مع أصدقائك!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="مثال: غزل، أحمد، سارة..."
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <AvatarPicker selectedAvatar={avatar} onSelectAvatar={setAvatar} />

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 text-white font-black text-lg shadow-xl shadow-rose-900/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isLoading ? 'جاري إنشاء الغرفة...' : 'تأكيد وإنشاء الغرفة 🚀'}</span>
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-500 pt-6 pb-2">
        اللعبة مجانية 100% وتدعم اللعب من عدة هواتف في الوقت نفسه!
      </div>
    </div>
  );
};
