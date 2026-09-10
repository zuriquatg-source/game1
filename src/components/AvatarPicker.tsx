import React from 'react';
import { AVATARS } from '../data/words.ts';
import { sound } from '../utils/audio.ts';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedAvatar, onSelectAvatar }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-300 mb-2">
        اختر شخصيتك (Avatar):
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-slate-800/80 rounded-2xl border border-slate-700/60 max-h-40 overflow-y-auto">
        {AVATARS.map((avatar) => {
          const isSelected = selectedAvatar === avatar;
          return (
            <button
              key={avatar}
              type="button"
              onClick={() => {
                sound.playClick();
                onSelectAvatar(avatar);
              }}
              className={`text-2xl p-2 rounded-xl flex items-center justify-center transition-all duration-150 transform active:scale-95 ${
                isSelected
                  ? 'bg-rose-500/30 border-2 border-rose-500 shadow-md shadow-rose-500/20 scale-110'
                  : 'bg-slate-700/40 hover:bg-slate-700/80 border border-transparent'
              }`}
            >
              {avatar}
            </button>
          );
        })}
      </div>
    </div>
  );
};
