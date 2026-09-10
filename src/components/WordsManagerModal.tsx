import React, { useState } from 'react';
import { X, Plus, Trash2, BookOpen } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface WordsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordsList: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
  isHost: boolean;
}

export const WordsManagerModal: React.FC<WordsManagerModalProps> = ({
  isOpen,
  onClose,
  wordsList,
  onAddWord,
  onRemoveWord,
  isHost,
}) => {
  const [newWord, setNewWord] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWord.trim()) {
      onAddWord(newWord.trim());
      setNewWord('');
      sound.playClueSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">بنك الكلمات ({wordsList.length})</h3>
            <p className="text-xs text-slate-400">
              {isHost ? 'يمكنك إضافة كلماتك المفضلة للغرفة!' : 'قائمة الكلمات المتاحة في هذه الجولة'}
            </p>
          </div>
        </div>

        {isHost && (
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="أضف كلمة جديدة (مثال: برغر، دبي...)"
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold rounded-2xl flex items-center gap-1 text-sm shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-64">
          <div className="flex flex-wrap gap-2">
            {wordsList.map((word) => (
              <div
                key={word}
                className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/70 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200"
              >
                <span>{word}</span>
                {isHost && wordsList.length > 5 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRemoveWord(word);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                    title="حذف الكلمة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
