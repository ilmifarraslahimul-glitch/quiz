import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Mascot } from '../components/common/Mascot';
import {
  Play,
  PlusCircle,
  FolderKanban,
  Settings,
  Info,
  Flame,
  CheckCircle2,
  XCircle,
  Trophy,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { sound } from '../lib/audio';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { motion } from 'motion/react';

export const HomePage: React.FC = () => {
  const {
    setActivePage,
    categories,
    questions,
    history,
    profile,
    startQuizSession,
  } = useApp();

  // Find last played category or recommended favorite category
  const lastPlayedCategory = useMemo(() => {
    if (history.length > 0) {
      const lastHist = history[0];
      const found = categories.find((c) => c.id === lastHist.categoryId);
      if (found) return found;
    }
    return categories.find((c) => c.isFavorite && !c.isArchived) || categories[0] || null;
  }, [history, categories]);

  // Aggregate stats
  const totalQuestionsAnswered = useMemo(() => {
    return history.reduce((sum, h) => sum + h.totalQuestions, 0);
  }, [history]);

  const totalCorrect = useMemo(() => {
    return history.reduce((sum, h) => sum + h.correctAnswers, 0);
  }, [history]);

  const totalIncorrect = useMemo(() => {
    return history.reduce((sum, h) => sum + h.incorrectAnswers, 0);
  }, [history]);

  const overallAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0;

  const bestScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(...history.map((h) => h.score));
  }, [history]);

  const handlePlayBig = () => {
    sound.playClick();
    if (lastPlayedCategory) {
      startQuizSession(lastPlayedCategory);
    } else {
      setActivePage('play');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Hero Game Stage */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 dark:from-indigo-900/50 dark:via-slate-900 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-500/20 p-6 sm:p-10 shadow-xl dark:shadow-2xl transition-colors duration-200">
        {/* Ambient background glow orbs */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          {/* Left: Mascot Greeting & Tagline */}
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Ready to Play?</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Hello, <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-cyan-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">Quiz Master!</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-md leading-relaxed">
              Selamat datang di <strong>QuizKu</strong>! Asah kemampuanmu, taklukkan timer vertikal, dan kembangkan bank soal cerdas dengan bantuan AI.
            </p>

            {/* Main Big Juicy PLAY Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayBig}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-black text-lg sm:text-xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white" />
                </div>
                <span>PLAY QUIZ SEKARANG</span>
              </motion.button>

              {lastPlayedCategory && (
                <button
                  onClick={() => startQuizSession(lastPlayedCategory)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <span>Lanjutkan: <strong>{lastPlayedCategory.name}</strong></span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
            </div>
          </div>

          {/* Right: 3D Interactive Mascot */}
          <div className="flex flex-col items-center justify-center relative">
            <Mascot mood="idle" size="lg" className="hover:scale-105 transition-transform" />
            <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-xs">
              Ketuk Si Ku untuk menyapa!
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Buttons */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => {
            sound.playClick();
            setActivePage('kelola-soal');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all text-left group cursor-pointer shadow-xs dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            Buat Quiz
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tambah & atur soal baru</p>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActivePage('koleksi');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all text-left group cursor-pointer shadow-xs dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
            Koleksi Quiz
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{categories.length} kategori aktif</p>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActivePage('pengaturan');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all text-left group cursor-pointer shadow-xs dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
            Pengaturan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Suara, tema & timer</p>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActivePage('tentang');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-400 dark:hover:border-pink-500/50 transition-all text-left group cursor-pointer shadow-xs dark:shadow-none"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
            Tentang QuizKu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Web by Rasfarilmi</p>
        </button>
      </section>

      {/* Activity Summary Cards (Cleaned up, no broken statistik link) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Ringkasan Aktivitas Belajar</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Quiz Tersedia */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Kategori</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{categories.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{questions.length} total soal</div>
          </div>

          {/* Card 2: Soal Dikerjakan */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Dikerjakan</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalQuestionsAnswered}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{history.length} sesi quiz</div>
          </div>

          {/* Card 3: Benar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Jawaban Benar</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCorrect}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{overallAccuracy}% akurasi</div>
          </div>

          {/* Card 4: Salah */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs mb-1">
              <XCircle className="w-4 h-4" />
              <span>Jawaban Salah</span>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalIncorrect}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bisa direview</div>
          </div>

          {/* Card 5: Skor Terbaik */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs mb-1">
              <Trophy className="w-4 h-4" />
              <span>Skor Terbaik</span>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{bestScore}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Poin tertinggi</div>
          </div>

          {/* Card 6: Streak Hari */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs mb-1">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>Streak Belajar</span>
            </div>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{profile?.streak || 1}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Hari konsisten</div>
          </div>
        </div>
      </section>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="card" />
    </div>
  );
};
