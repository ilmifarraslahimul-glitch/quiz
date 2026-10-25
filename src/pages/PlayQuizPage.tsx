import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Question, QuizResultItem, QuizHistory, QuizMode } from '../types';
import { sound } from '../lib/audio';
import { Mascot } from '../components/common/Mascot';
import { ConfirmModal } from '../components/common/ConfirmModal';
import confetti from 'canvas-confetti';
import {
  Play,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  RotateCcw,
  ListChecks,
  Search,
  Star,
  Sparkles,
  Zap,
  HelpCircle,
  Layers,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type QuizState = 'select_category' | 'prep' | 'countdown' | 'in_quiz' | 'result' | 'review';

export const PlayQuizPage: React.FC = () => {
  const {
    categories,
    questions,
    history,
    settings,
    setActivePage,
    saveQuizHistory,
    selectedCategoryForPlay,
    selectedModeForPlay,
    showToast,
  } = useApp();

  // Screen State
  const [quizState, setQuizState] = useState<QuizState>(
    selectedCategoryForPlay ? 'prep' : 'select_category'
  );
  const [targetCategory, setTargetCategory] = useState<Category | null>(
    selectedCategoryForPlay || null
  );
  const [quizMode, setQuizMode] = useState<QuizMode>(selectedModeForPlay || 'challenge');
  const [questionCountLimit, setQuestionCountLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Active Quiz Session State
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [answeredState, setAnsweredState] = useState<Record<number, boolean>>({});
  const [resultItems, setResultItems] = useState<QuizResultItem[]>([]);
  const [countdownNum, setCountdownNum] = useState<number | 'GO'>(3);
  const [completedHistory, setCompletedHistory] = useState<QuizHistory | null>(null);

  // Per-Question Accurate Vertical Timer State
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [questionMaxDuration, setQuestionMaxDuration] = useState<number>(20);
  const timerStartRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  const isQuestionAnsweredRef = useRef<boolean>(false);

  // Modals & Navigation Guards
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  // Filtered categories for selection
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (cat.isArchived) return false;
      if (onlyFavorites && !cat.isFavorite) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categories, onlyFavorites, searchQuery]);

  // Questions available for target category
  const availableQuestionsForCategory = useMemo(() => {
    if (!targetCategory) return [];
    return questions.filter((q) => q.categoryId === targetCategory.id);
  }, [questions, targetCategory]);

  // Best score for category
  const categoryBestScore = useMemo(() => {
    if (!targetCategory) return 0;
    const catHist = history.filter((h) => h.categoryId === targetCategory.id);
    if (catHist.length === 0) return 0;
    return Math.max(...catHist.map((h) => h.score));
  }, [history, targetCategory]);

  // Update question limit when category selected
  useEffect(() => {
    if (targetCategory) {
      const available = questions.filter((q) => q.categoryId === targetCategory.id).length;
      const initialLimit = Math.min(available, targetCategory.defaultQuestionsPerSession || 10);
      setQuestionCountLimit(Math.min(25, Math.max(1, initialLimit)));
    }
  }, [targetCategory, questions]);

  // Handle Preparing Quiz
  const handleSelectCategory = (cat: Category) => {
    const count = questions.filter((q) => q.categoryId === cat.id).length;
    if (count === 0) {
      showToast(`Kategori "${cat.name}" belum memiliki soal. Silakan buat soal terlebih dahulu.`, 'error');
      return;
    }
    sound.playClick();
    setTargetCategory(cat);
    setQuizState('prep');
  };

  // Start Countdown Sequence
  const handleStartCountdown = () => {
    if (!targetCategory) return;
    const catQuestions = questions.filter((q) => q.categoryId === targetCategory.id);
    if (catQuestions.length === 0) {
      showToast('Belum ada soal untuk kategori ini.', 'error');
      return;
    }

    sound.playClick();
    let prepared = [...catQuestions];
    if (settings.shuffleQuestions) {
      prepared.sort(() => Math.random() - 0.5);
    }
    prepared = prepared.slice(0, Math.min(25, questionCountLimit));

    setSessionQuestions(prepared);
    setCurrentIndex(0);
    setUserAnswers({});
    setAnsweredState({});
    setResultItems([]);
    setCountdownNum(3);
    setQuizState('countdown');

    sound.playCountdown(false);
  };

  // Countdown effect: 3 -> 2 -> 1 -> GO!
  useEffect(() => {
    if (quizState !== 'countdown') return;

    if (countdownNum === 3) {
      const t = setTimeout(() => {
        setCountdownNum(2);
        sound.playCountdown(false);
      }, 800);
      return () => clearTimeout(t);
    }
    if (countdownNum === 2) {
      const t = setTimeout(() => {
        setCountdownNum(1);
        sound.playCountdown(false);
      }, 800);
      return () => clearTimeout(t);
    }
    if (countdownNum === 1) {
      const t = setTimeout(() => {
        setCountdownNum('GO');
        sound.playCountdown(true);
      }, 800);
      return () => clearTimeout(t);
    }
    if (countdownNum === 'GO') {
      const t = setTimeout(() => {
        setQuizState('in_quiz');
      }, 600);
      return () => clearTimeout(t);
    }
  }, [quizState, countdownNum]);

  // Current Question
  const currentQuestion = sessionQuestions[currentIndex];

  // Options
  const displayOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return [...currentQuestion.options];
  }, [currentQuestion]);

  // End Quiz Session
  const finishQuizSession = useCallback(
    async (finalResults: QuizResultItem[]) => {
      if (!targetCategory) return;

      const totalQs = finalResults.length;
      const correctCount = finalResults.filter((r) => r.isCorrect).length;
      const incorrectCount = finalResults.filter((r) => !r.isCorrect && r.userAnswer !== '').length;
      const unansweredCount = finalResults.filter((r) => r.userAnswer === '').length;

      // Accuracy formula: (Jumlah jawaban benar ÷ Jumlah soal yang dinilai) × 100%
      const accuracy = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;

      const totalPointsEarned = finalResults.reduce((acc, curr, idx) => {
        const q = sessionQuestions[idx];
        return acc + (curr.isCorrect ? q?.points || 10 : 0);
      }, 0);
      const maxPossiblePoints = sessionQuestions.reduce((acc, q) => acc + (q.points || 10), 0);
      const score = maxPossiblePoints > 0 ? Math.round((totalPointsEarned / maxPossiblePoints) * 100) : 0;

      const totalDuration = finalResults.reduce((sum, r) => sum + r.timeSpentSeconds, 0);
      const averageTime = totalQs > 0 ? Number((totalDuration / totalQs).toFixed(1)) : 0;

      const newHistory = await saveQuizHistory({
        categoryId: targetCategory.id,
        categoryName: targetCategory.name,
        totalQuestions: totalQs,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered: unansweredCount,
        score,
        maxScore: 100,
        accuracy,
        totalDurationSeconds: Math.round(totalDuration),
        averageTimePerQuestion: averageTime,
        mode: quizMode,
        completedAt: new Date().toISOString(),
        items: finalResults,
      });

      setCompletedHistory(newHistory);
      setQuizState('result');
      sound.playVictory();

      if (score >= 60) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    },
    [targetCategory, sessionQuestions, quizMode, saveQuizHistory]
  );

  // Handle Question Answer Selection
  const handleSelectAnswer = useCallback(
    (selectedOption: string) => {
      if (!currentQuestion || isQuestionAnsweredRef.current) return;
      isQuestionAnsweredRef.current = true;

      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
      }

      const timeSpent = Math.max(
        0.5,
        Number(((performance.now() - questionStartTimeRef.current) / 1000).toFixed(1))
      );

      const isCorrect =
        selectedOption.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        sound.playCorrect();
      } else {
        sound.playIncorrect();
      }

      setUserAnswers((prev) => ({ ...prev, [currentIndex]: selectedOption }));
      setAnsweredState((prev) => ({ ...prev, [currentIndex]: true }));

      const newResultItem: QuizResultItem = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        questionType: currentQuestion.questionType,
        options: currentQuestion.options,
        userAnswer: selectedOption,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        timeSpentSeconds: timeSpent,
        explanation: currentQuestion.explanation,
      };

      const updatedResults = [...resultItems, newResultItem];
      setResultItems(updatedResults);

      const delayMs = Math.max(600, (settings.autoNextDelay || 1.2) * 1000);
      setTimeout(() => {
        if (currentIndex + 1 < sessionQuestions.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          finishQuizSession(updatedResults);
        }
      }, delayMs);
    },
    [currentQuestion, currentIndex, resultItems, sessionQuestions.length, settings.autoNextDelay, finishQuizSession]
  );

  // Handle Time Expired
  const handleTimeExpired = useCallback(() => {
    if (!currentQuestion || isQuestionAnsweredRef.current) return;
    isQuestionAnsweredRef.current = true;

    sound.playIncorrect();
    const duration = currentQuestion.duration || targetCategory?.defaultDuration || 20;

    setUserAnswers((prev) => ({ ...prev, [currentIndex]: '' }));
    setAnsweredState((prev) => ({ ...prev, [currentIndex]: true }));

    const newResultItem: QuizResultItem = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      questionType: currentQuestion.questionType,
      options: currentQuestion.options,
      userAnswer: '',
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: false,
      timeSpentSeconds: duration,
      explanation: currentQuestion.explanation,
    };

    const updatedResults = [...resultItems, newResultItem];
    setResultItems(updatedResults);

    const delayMs = Math.max(800, (settings.autoNextDelay || 1.2) * 1000);
    setTimeout(() => {
      if (currentIndex + 1 < sessionQuestions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishQuizSession(updatedResults);
      }
    }, delayMs);
  }, [currentQuestion, currentIndex, resultItems, sessionQuestions.length, settings.autoNextDelay, targetCategory, finishQuizSession]);

  // Accurate Timer Loop
  useEffect(() => {
    if (quizState !== 'in_quiz' || !currentQuestion) return;

    isQuestionAnsweredRef.current = false;
    const duration = currentQuestion.duration || targetCategory?.defaultDuration || 20;
    setQuestionMaxDuration(duration);
    setTimeLeft(duration);

    timerStartRef.current = performance.now();
    questionStartTimeRef.current = performance.now();

    if (quizMode === 'zen') {
      return;
    }

    const updateTimer = () => {
      if (isQuestionAnsweredRef.current) return;

      const elapsedMs = performance.now() - timerStartRef.current;
      const remaining = Math.max(0, duration - elapsedMs / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimeExpired();
      } else {
        timerRafRef.current = requestAnimationFrame(updateTimer);
      }
    };

    timerRafRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
      }
    };
  }, [quizState, currentIndex, currentQuestion, targetCategory, quizMode, handleTimeExpired]);

  // Keyboard navigation
  useEffect(() => {
    if (quizState !== 'in_quiz' || !currentQuestion || isQuestionAnsweredRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const optionMap: Record<string, number> = {
        '1': 0,
        A: 0,
        '2': 1,
        B: 1,
        '3': 2,
        C: 2,
        '4': 3,
        D: 3,
      };

      if (key in optionMap) {
        const idx = optionMap[key];
        if (displayOptions[idx]) {
          handleSelectAnswer(displayOptions[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizState, currentQuestion, displayOptions, handleSelectAnswer]);

  const timerPercentage = questionMaxDuration > 0 ? (timeLeft / questionMaxDuration) * 100 : 0;
  const isTimeCritical = timeLeft <= 3 && timeLeft > 0 && quizMode !== 'zen';
  const timerBarColor =
    timerPercentage > 50
      ? 'from-emerald-500 to-cyan-500'
      : timerPercentage > 25
      ? 'from-amber-500 to-orange-500'
      : 'from-rose-500 to-red-600 animate-pulse';

  const getOptionLabel = (idx: number) => String.fromCharCode(65 + idx);

  const handleRequestExit = () => {
    if (quizState === 'in_quiz') {
      if (settings.confirmExit) {
        setShowExitConfirm(true);
      } else {
        setQuizState('select_category');
      }
    } else {
      setQuizState('select_category');
    }
  };

  const handleRetryMistakes = () => {
    if (!completedHistory) return;
    const mistakeItems = completedHistory.items.filter((item) => !item.isCorrect);
    if (mistakeItems.length === 0) {
      showToast('Hebat! Tidak ada soal yang salah.', 'success');
      return;
    }

    const retryQs = questions.filter((q) =>
      mistakeItems.some((m) => m.questionId === q.id)
    );

    if (retryQs.length > 0) {
      setSessionQuestions(retryQs);
      setCurrentIndex(0);
      setUserAnswers({});
      setAnsweredState({});
      setResultItems([]);
      setCountdownNum(3);
      setQuizState('countdown');
      sound.playCountdown(false);
    }
  };

  // ----------------------------------------------------
  // RENDER SCREEN 1: CATEGORY SELECTION
  // ----------------------------------------------------
  if (quizState === 'select_category') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12 transition-colors">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Play className="w-7 h-7 text-indigo-500 dark:text-indigo-400 fill-indigo-500 dark:fill-indigo-400" />
              <span>Pilih Kategori Quiz</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Pilih topik latihan dan uji pengetahuanmu sekarang!
            </p>
          </div>

          {/* Search & Favorites Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500 text-amber-600 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Filter Favorit"
            >
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-400 text-amber-500 dark:text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = questions.filter((q) => q.categoryId === cat.id).length;
            const catHist = history.filter((h) => h.categoryId === cat.id);
            const best = catHist.length > 0 ? Math.max(...catHist.map((h) => h.score)) : 0;

            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectCategory(cat)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 shadow-md dark:shadow-xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent top color banner */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: cat.color || '#4F46E5' }}
                />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: cat.color || '#4F46E5' }}
                    >
                      <Layers className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cat.isFavorite && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500 dark:text-amber-400" />
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {cat.defaultDifficulty || 'Sedang'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description || 'Kategori latihan soal interaktif QuizKu.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>{count} Soal</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{cat.defaultDuration || 20}s/soal</span>
                  </div>

                  {best > 0 && (
                    <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{best} pts</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <Mascot mood="thinking" size="md" className="mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tidak ada kategori ditemukan</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau buat kategori baru di menu Koleksi Quiz.
            </p>
            <button
              onClick={() => setActivePage('koleksi')}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Kelola Kategori
            </button>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SCREEN 2: PREPARATION SCREEN
  // ----------------------------------------------------
  if (quizState === 'prep' && targetCategory) {
    const totalAvailable = availableQuestionsForCategory.length;

    return (
      <div className="max-w-xl mx-auto py-4 space-y-6 transition-colors">
        <button
          onClick={() => setQuizState('select_category')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pilihan Kategori</span>
        </button>

        <div className="rounded-3xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden">
          {/* Category Top Banner */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
              style={{ backgroundColor: targetCategory.color || '#4F46E5' }}
            >
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Persiapan Quiz
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{targetCategory.name}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{targetCategory.description}</p>
            </div>
          </div>

          {/* Info Badges */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Tersedia</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{totalAvailable} Soal</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Durasi</div>
              <div className="text-lg font-black text-cyan-600 dark:text-cyan-400">{targetCategory.defaultDuration}s / soal</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Skor Terbaik</div>
              <div className="text-lg font-black text-amber-500 dark:text-amber-400">{categoryBestScore} pts</div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Mode Quiz</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setQuizMode('challenge')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  quizMode === 'challenge'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Mode Tantangan</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Timer vertikal & skor game</p>
              </button>

              <button
                type="button"
                onClick={() => setQuizMode('zen')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  quizMode === 'zen'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  <span>Mode Santai (Zen)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tanpa tekanan batas waktu</p>
              </button>
            </div>
          </div>

          {/* Question Limit Slider / Selector */}
          <div className="space-y-2 mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Jumlah Soal Sesi Ini:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{questionCountLimit} Soal</span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.min(25, totalAvailable)}
              value={questionCountLimit}
              onChange={(e) => setQuestionCountLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>1 Soal</span>
              <span>Maksimal 25 Soal</span>
            </div>
          </div>

          {/* Immediate Evaluation Note */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>Jawaban akan langsung diperiksa secara otomatis setelah dipilih.</span>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartCountdown}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-black text-lg shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>MULAI QUIZ</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SCREEN 3: COUNTDOWN ANIMATION
  // ----------------------------------------------------
  if (quizState === 'countdown') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 dark:bg-slate-950/90 backdrop-blur-md">
        <motion.div
          key={countdownNum}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.2, 1], opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="text-8xl sm:text-9xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl">
            {countdownNum}
          </div>
          <div className="mt-4 text-base sm:text-lg font-bold text-slate-200 dark:text-slate-300 uppercase tracking-widest">
            {countdownNum === 'GO' ? 'Selamat Mengerjakan!' : 'Bersiaplah...'}
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SCREEN 4: QUIZ GAMEPLAY
  // ----------------------------------------------------
  if (quizState === 'in_quiz' && currentQuestion) {
    const isAnswered = answeredState[currentIndex] || false;
    const chosenAnswer = userAnswers[currentIndex] || '';

    return (
      <div className="max-w-4xl mx-auto pb-8 space-y-4 transition-colors">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={handleRequestExit}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>

          {/* Progress / Number of Questions */}
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Soal <strong className="text-slate-900 dark:text-white text-base">{currentIndex + 1}</strong> / {sessionQuestions.length}
            </span>
            <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Category Badge */}
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 truncate max-w-[120px] sm:max-w-[200px]">
            {targetCategory?.name}
          </div>
        </div>

        {/* Main Quiz Arena with Vertical Timer on the Side */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Vertical Timer Column (Energy Bar Style) */}
          {quizMode !== 'zen' && (
            <div className="md:col-span-2 order-2 md:order-1 flex md:flex-col items-center justify-between md:justify-center p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-3">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sisa Waktu
                </div>
                <div
                  className={`text-2xl font-black font-mono transition-colors ${
                    isTimeCritical ? 'text-rose-600 dark:text-rose-500 animate-bounce' : 'text-cyan-600 dark:text-cyan-400'
                  }`}
                >
                  {Math.ceil(timeLeft)}s
                </div>
              </div>

              {/* Vertical Bar Container on Desktop / Horizontal on Small Mobile */}
              <div className="w-full md:w-5 h-3 md:h-64 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative p-0.5 border border-slate-300 dark:border-slate-700/60">
                <motion.div
                  className={`w-full rounded-full bg-gradient-to-t ${timerBarColor} transition-all duration-100 ease-linear`}
                  style={{
                    height: `${timerPercentage}%`,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                  }}
                />
              </div>

              <div className="text-[10px] text-slate-500 text-center hidden md:block font-medium">
                Energi Timer
              </div>
            </div>
          )}

          {/* Question & Options Area */}
          <div className={`${quizMode === 'zen' ? 'col-span-12' : 'col-span-1 md:col-span-10'} order-1 md:order-2 space-y-4`}>
            {/* Question Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentQuestion.difficulty}</span>
                <span>+{currentQuestion.points || 10} Poin</span>
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answer Options Cards (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayOptions.map((option, idx) => {
                const label = getOptionLabel(idx);
                const isSelected = chosenAnswer === option;
                const isTargetCorrect =
                  option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

                let cardStyle =
                  'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-slate-50 dark:hover:bg-slate-850';

                if (isAnswered) {
                  if (isTargetCorrect) {
                    cardStyle =
                      'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md shadow-emerald-500/20';
                  } else if (isSelected && !isTargetCorrect) {
                    cardStyle =
                      'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-100 animate-shake shadow-md shadow-rose-500/20';
                  } else {
                    cardStyle = 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 opacity-60';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    whileHover={!isAnswered ? { scale: 1.015 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    onClick={() => handleSelectAnswer(option)}
                    className={`p-4 sm:p-5 rounded-2xl border text-left flex items-center justify-between gap-3.5 transition-all cursor-pointer ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                          isAnswered && isTargetCorrect
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : isAnswered && isSelected && !isTargetCorrect
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-sm sm:text-base font-semibold">{option}</span>
                    </div>

                    {isAnswered && isTargetCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isTargetCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Answer Feedback Banner */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    chosenAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-300'
                  }`}
                >
                  {chosenAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase() ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sm">
                      {chosenAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
                        ? 'Mantap! Jawaban Benar! 🎉'
                        : chosenAnswer === ''
                        ? 'Waktu Habis! Soal dianggap belum dijawab.'
                        : `Kurang Tepat. Kunci jawaban: "${currentQuestion.correctAnswer}"`}
                    </div>
                    {currentQuestion.explanation && (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        <strong>Pembahasan:</strong> {currentQuestion.explanation}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        <ConfirmModal
          isOpen={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setQuizState('select_category');
            setShowExitConfirm(false);
          }}
          title="Keluar dari Quiz?"
          message="Progres pengerjaan sesi quiz ini akan hilang jika kamu keluar sekarang."
          confirmLabel="Ya, Keluar"
          cancelLabel="Lanjutkan Quiz"
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SCREEN 5: VICTORY RESULT SCREEN
  // ----------------------------------------------------
  if (quizState === 'result' && completedHistory) {
    const isPerfect = completedHistory.score === 100;
    const isGood = completedHistory.score >= 70;

    return (
      <div className="max-w-xl mx-auto py-6 space-y-6 transition-colors">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center shadow-xl dark:shadow-2xl relative overflow-hidden"
        >
          {/* Header Mascot Reaction */}
          <div className="flex justify-center mb-3">
            <Mascot mood={isPerfect ? 'cheering' : isGood ? 'happy' : 'sad'} size="lg" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Hasil Latihan Quiz
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
            {isPerfect ? 'Luar Biasa, Sempurna!' : isGood ? 'Kerja Bagus, Quiz Master!' : 'Tetap Semangat!'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Kategori: <strong>{completedHistory.categoryName}</strong>
          </p>

          {/* Star Rating Badge */}
          <div className="flex items-center justify-center gap-2 my-4">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`w-7 h-7 ${
                  star === 1 || (star === 2 && completedHistory.score >= 50) || (star === 3 && completedHistory.score >= 80)
                    ? 'fill-amber-400 text-amber-500 dark:text-amber-400'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Big Score Dial */}
          <div className="my-6 p-6 rounded-3xl bg-slate-50 dark:bg-gradient-to-br dark:from-indigo-950/60 dark:to-purple-950/60 border border-slate-200 dark:border-indigo-500/30 flex flex-col items-center justify-center">
            <div className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
              {completedHistory.score}
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1">
              Skor Akhir ({completedHistory.accuracy}% Akurasi)
            </div>
          </div>

          {/* Detailed Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left mb-6">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Soal</span>
              <div className="text-base font-bold text-slate-900 dark:text-white">{completedHistory.totalQuestions}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Jawaban Benar</span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{completedHistory.correctAnswers}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
              <span className="text-[11px] text-rose-600 dark:text-rose-400">Jawaban Salah</span>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400">{completedHistory.incorrectAnswers}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400">Rata-rata Waktu</span>
              <div className="text-base font-bold text-cyan-600 dark:text-cyan-400">{completedHistory.averageTimePerQuestion}s</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartCountdown}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Main Lagi</span>
            </button>

            {completedHistory.incorrectAnswers > 0 && (
              <button
                onClick={handleRetryMistakes}
                className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Ulangi {completedHistory.incorrectAnswers} Soal yang Salah Saja</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQuizState('review')}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ListChecks className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Lihat Pembahasan</span>
              </button>

              <button
                onClick={() => setQuizState('select_category')}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Pilih Kategori Lain</span>
              </button>
            </div>

            <button
              onClick={() => setActivePage('beranda')}
              className="w-full py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SCREEN 6: ANSWER REVIEW (PEMBAHASAN JAWABAN)
  // ----------------------------------------------------
  if (quizState === 'review' && completedHistory) {
    const filteredReviewItems = completedHistory.items.filter((item) => {
      if (reviewFilter === 'correct') return item.isCorrect;
      if (reviewFilter === 'incorrect') return !item.isCorrect;
      return true;
    });

    return (
      <div className="max-w-3xl mx-auto py-4 space-y-6 pb-12 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setQuizState('result')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Skor</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                reviewFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({completedHistory.items.length})
            </button>
            <button
              onClick={() => setReviewFilter('correct')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Benar ({completedHistory.correctAnswers})
            </button>
            <button
              onClick={() => setReviewFilter('incorrect')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Salah ({completedHistory.incorrectAnswers})
            </button>
          </div>
        </div>

        {/* Review Items List */}
        <div className="space-y-4">
          {filteredReviewItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-3xl border shadow-sm dark:shadow-lg space-y-3 ${
                item.isCorrect
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Soal #{idx + 1}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full ${
                    item.isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                  }`}
                >
                  {item.isCorrect ? 'Benar (+)' : 'Salah (-)'} • {item.timeSpentSeconds}s
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">{item.question}</h4>

              {/* Answers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Jawaban Kamu:</span>
                  <span
                    className={`font-semibold ${
                      item.userAnswer === ''
                        ? 'text-amber-600 dark:text-amber-400 italic'
                        : item.isCorrect
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.userAnswer || '(Tidak Dijawab / Waktu Habis)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Kunci Jawaban Benar:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.correctAnswer}</span>
                </div>
              </div>

              {/* Explanation */}
              {item.explanation && (
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-indigo-600 dark:text-indigo-400">Penjelasan:</strong> {item.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
