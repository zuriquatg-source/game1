import React from 'react';
import { X, HelpCircle, Eye, MessageSquare, Award, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
            🎭
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">طريقة لعب "المندس"</h3>
            <p className="text-xs text-rose-400 font-medium">فكرة وإعداد: غزل (GHAZAL)</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-bold text-white mb-1">
              <Eye className="w-4 h-4 text-rose-400" />
              <span>1. توزيع الأدوار والكلمة السرية</span>
            </div>
            <p className="text-xs text-slate-400">
              في كل جولة، يعرف الجميع الكلمة السرية ما عدا لاعب واحد عشوائي هو <strong>المندس</strong>. المندس يحاول التظاهر بأنه يعرف الكلمة!
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-bold text-white mb-1">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>2. مرحلة التلميحات الثلاثة (3 تلميحات لكل لاعب)</span>
            </div>
            <p className="text-xs text-slate-400">
              يقدم كل لاعب 3 تلميحات بالتتابع. وتبقى الكلمة السرية ظاهرة دائماً للمواطنين حتى لا ينسوها!
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-bold text-white mb-1">
              <span className="text-sm">🗣️</span>
              <span>3. مرحلة النقاش والتحقيق (30 ثانية)</span>
            </div>
            <p className="text-xs text-slate-400">
              عداد لمدة 30 ثانية للنقاش الصوتي عبر المايك، لمقارنة تلميحات الجميع واستجواب المشتبه بهم!
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-bold text-white mb-1">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>4. التصويت وكشف المندس «مسكتك غزل!» 😂</span>
            </div>
            <p className="text-xs text-slate-400">
              يصوت الجميع على المشتبه به، وعند كشف المندس يصدح صوت اللعبة «مسكتك غزل!» مع ضحكة ساخرة!
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-bold text-white mb-1">
              <Award className="w-4 h-4 text-purple-400" />
              <span>4. توزيع النقاط والفوز</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>المندس إذا لم ينكشف: <strong className="text-emerald-400">+100 نقطة</strong></li>
              <li>المندس إذا انكشف ولكن خمن الكلمة صحيحة: <strong className="text-emerald-400">+80 نقطة</strong></li>
              <li>المواطنون إذا كشفوا المندس ولم يخمن الكلمة: <strong className="text-emerald-400">+50 نقطة</strong> لكل مواطن</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="mt-6 w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-98"
        >
          فهمت القواعد، يلا نلعب! 🚀
        </button>
      </div>
    </div>
  );
};
