import React from 'react';
import { Mascot } from '../components/common/Mascot';
import { Cloud, Sparkles, Smartphone } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 pb-16 transition-colors">
      {/* Brand Hero Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 border border-indigo-500/30 text-center shadow-xl dark:shadow-2xl relative overflow-hidden text-white">
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-1 shadow-2xl shadow-indigo-500/30 mb-4">
            <img
              src="/icon.svg"
              alt="QuizKu Brand Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Quiz<span className="text-cyan-400">Ku</span>
          </h1>

          <p className="text-indigo-200 font-bold text-sm sm:text-base italic mt-1 tracking-wide">
            Play. Think. Level Up!
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold text-indigo-200 uppercase tracking-widest">
            Versi 1.0.0 • Production Ready
          </div>
        </div>
      </div>

      {/* Description & Mission */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mengenai QuizKu</h2>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>QuizKu</strong> adalah platform latihan quiz edukasi interaktif yang dirancang untuk menjadikan proses belajar terasa seperti sebuah game yang seru dan menantang. Pengguna memiliki kendali penuh untuk membuat soal sendiri, menentukan durasi pengerjaan, mengatur kategori, serta memanfaatkan kecerdasan buatan (AI) untuk membuat variasi soal dan opsi pengecoh secara otomatis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Kecerdasan Buatan (AI)</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Bantuan AI untuk membuat pengecoh jawaban, memeriksa kualitas soal, dan merancang soal serupa.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-1">
              <Cloud className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sinkronisasi Cloud & Lokal</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Terhubung dengan Google Authentication dan Cloud Firestore, serta cache IndexedDB untuk dukungan offline.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Progressive Web App</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Dapat diinstal langsung dari browser Chrome pada laptop, tablet, dan smartphone Android / iOS.
            </p>
          </div>
        </div>

        {/* Mascot section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 justify-between flex-col sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kenalkan Maskot Kita: Si Ku!</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
              Karakter tanda tanya ceria yang siap menemani setiap sesi latihan quiz dan merayakan pencapaian skormu.
            </p>
          </div>
          <Mascot mood="happy" size="sm" />
        </div>
      </div>

      {/* Mandatory Credit Footer */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm">
        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide">
          Web by Rasfarilmi
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          QuizKu — Game Quiz Edukasi Interaktif • 2026
        </p>
      </div>
    </div>
  );
};
