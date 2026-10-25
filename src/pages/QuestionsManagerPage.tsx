import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Question, QuestionType, DifficultyLevel, AIReviewResult } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { sound } from '../lib/audio';
import {
  FileEdit,
  Plus,
  Search,
  Copy,
  Trash2,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Check,
} from 'lucide-react';

export const QuestionsManagerPage: React.FC = () => {
  const {
    categories,
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    deleteQuestionsBatch,
    duplicateQuestion,
    importQuestionsBatch,
    showToast,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'question'>('newest');

  // Multi-select for bulk actions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState<string>('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Single Question Delete Target
  const [deleteTargetQuestion, setDeleteTargetQuestion] = useState<Question | null>(null);

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form Fields
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formQuestionType, setFormQuestionType] = useState<QuestionType>('multiple_choice');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formDuration, setFormDuration] = useState(20);
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('Sedang');
  const [formPoints, setFormPoints] = useState(15);

  // AI State in Form
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [isReviewingQuality, setIsReviewingQuality] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<AIReviewResult | null>(null);
  const [generatingSimilarId, setGeneratingSimilarId] = useState<string | null>(null);

  // Import / Export JSON & CSV Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Filtered & Sorted Questions
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (selectedCategoryFilter !== 'all' && q.categoryId !== selectedCategoryFilter) return false;
        if (selectedDifficultyFilter !== 'all' && q.difficulty !== selectedDifficultyFilter) return false;
        if (searchQuery.trim()) {
          const s = searchQuery.toLowerCase();
          return q.question.toLowerCase().includes(s) || q.correctAnswer.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return a.question.localeCompare(b.question);
      });
  }, [questions, selectedCategoryFilter, selectedDifficultyFilter, searchQuery, sortBy]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    sound.playClick();
    setEditingQuestion(null);
    setFormCategoryId(categories[0]?.id || '');
    setFormQuestionText('');
    setFormQuestionType('multiple_choice');
    setFormOptions(['', '', '', '']);
    setFormCorrectAnswer('');
    setFormExplanation('');
    const targetCat = categories[0];
    setFormDuration(targetCat?.defaultDuration || 20);
    setFormDifficulty('Sedang');
    setFormPoints(15);
    setAiReviewResult(null);
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (q: Question) => {
    sound.playClick();
    setEditingQuestion(q);
    setFormCategoryId(q.categoryId);
    setFormQuestionText(q.question);
    setFormQuestionType(q.questionType || 'multiple_choice');
    setFormOptions(q.options && q.options.length >= 2 ? [...q.options] : ['', '', '', '']);
    setFormCorrectAnswer(q.correctAnswer);
    setFormExplanation(q.explanation || '');
    setFormDuration(q.duration || 20);
    setFormDifficulty(q.difficulty || 'Sedang');
    setFormPoints(q.points || 15);
    setAiReviewResult(null);
    setIsFormModalOpen(true);
  };

  // Add / Remove Options
  const handleOptionChange = (index: number, val: string) => {
    const updated = [...formOptions];
    updated[index] = val;
    setFormOptions(updated);
  };

  const handleAddOptionField = () => {
    if (formOptions.length >= 6) {
      showToast('Maksimal 6 pilihan jawaban.', 'info');
      return;
    }
    setFormOptions([...formOptions, '']);
  };

  const handleRemoveOptionField = (index: number) => {
    if (formOptions.length <= 2) {
      showToast('Minimal 2 pilihan jawaban.', 'info');
      return;
    }
    const target = formOptions[index];
    const updated = formOptions.filter((_, idx) => idx !== index);
    setFormOptions(updated);
    if (formCorrectAnswer === target) {
      setFormCorrectAnswer(updated[0] || '');
    }
  };

  // AI Feature A: Bantu AI Membuat Opsi
  const handleAIGenerateOptions = async () => {
    if (!formQuestionText.trim()) {
      showToast('Ketik pertanyaan terlebih dahulu.', 'error');
      return;
    }
    if (!formCorrectAnswer.trim()) {
      showToast('Tentukan kunci jawaban benar yang tepat terlebih dahulu.', 'error');
      return;
    }

    setIsGeneratingOptions(true);
    sound.playClick();

    try {
      const response = await fetch('/api/ai/generate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formQuestionText,
          correctAnswer: formCorrectAnswer,
          count: Math.max(3, formOptions.length - 1),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghasilkan opsi dari server AI.');
      }

      if (data.distractors && Array.isArray(data.distractors)) {
        const newOptions = [formCorrectAnswer, ...data.distractors];
        setFormOptions(newOptions);
        showToast('Opsi pilihan salah berhasil dibuat oleh AI!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal menghubungkan ke layanan AI.', 'error');
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  // AI Feature D: AI Periksa Kualitas Soal
  const handleAIReviewQuality = async () => {
    if (!formQuestionText.trim() || !formCorrectAnswer.trim()) {
      showToast('Isi pertanyaan dan tentukan kunci jawaban benar terlebih dahulu.', 'error');
      return;
    }

    setIsReviewingQuality(true);
    sound.playClick();

    try {
      const validOptions = formOptions.filter((o) => o.trim().length > 0);
      const response = await fetch('/api/ai/review-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formQuestionText,
          options: validOptions,
          correctAnswer: formCorrectAnswer,
          questionType: formQuestionType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memeriksa kualitas soal.');
      }

      setAiReviewResult(data.review);
      if (data.review?.improvedExplanation && !formExplanation) {
        setFormExplanation(data.review.improvedExplanation);
      }
      showToast('Pemeriksaan kualitas soal selesai!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal memeriksa kualitas soal.', 'error');
    } finally {
      setIsReviewingQuality(false);
    }
  };

  // AI Feature C: Buat Soal Serupa dengan AI
  const handleAIGenerateSimilar = async (targetQ: Question) => {
    setGeneratingSimilarId(targetQ.id);
    sound.playClick();

    try {
      const response = await fetch('/api/ai/generate-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: {
            question: targetQ.question,
            options: targetQ.options,
            correctAnswer: targetQ.correctAnswer,
            explanation: targetQ.explanation,
            difficulty: targetQ.difficulty,
            duration: targetQ.duration,
            points: targetQ.points,
            questionType: targetQ.questionType,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat soal serupa.');
      }

      if (data.question) {
        await addQuestion({
          categoryId: targetQ.categoryId,
          question: data.question.question,
          questionType: data.question.questionType || 'multiple_choice',
          options: data.question.options,
          correctAnswer: data.question.correctAnswer,
          explanation: data.question.explanation,
          duration: data.question.duration,
          difficulty: data.question.difficulty,
          points: data.question.points,
        });
        showToast('Soal serupa dengan variasi baru berhasil dibuat!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal membuat soal serupa dengan AI.', 'error');
    } finally {
      setGeneratingSimilarId(null);
    }
  };

  // Save Question Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formQuestionText.trim()) {
      showToast('Teks pertanyaan tidak boleh kosong.', 'error');
      return;
    }
    if (!formCategoryId) {
      showToast('Kategori wajib dipilih.', 'error');
      return;
    }

    let finalOptions: string[] = [];
    if (formQuestionType === 'multiple_choice') {
      finalOptions = formOptions.map((o) => o.trim()).filter((o) => o.length > 0);
      if (finalOptions.length < 2) {
        showToast('Soal pilihan ganda membutuhkan minimal 2 opsi jawaban.', 'error');
        return;
      }
      if (!formCorrectAnswer.trim()) {
        showToast('Pilih salah satu opsi sebagai jawaban benar.', 'error');
        return;
      }
      if (!finalOptions.includes(formCorrectAnswer.trim())) {
        finalOptions.push(formCorrectAnswer.trim());
      }
    } else if (formQuestionType === 'true_false') {
      finalOptions = ['Benar', 'Salah'];
      if (!['Benar', 'Salah'].includes(formCorrectAnswer)) {
        showToast('Pilih Benar atau Salah sebagai jawaban.', 'error');
        return;
      }
    } else {
      if (!formCorrectAnswer.trim()) {
        showToast('Ketik kunci jawaban singkat yang benar.', 'error');
        return;
      }
      finalOptions = [formCorrectAnswer.trim()];
    }

    sound.playClick();

    if (editingQuestion) {
      await updateQuestion(editingQuestion.id, {
        categoryId: formCategoryId,
        question: formQuestionText.trim(),
        questionType: formQuestionType,
        options: finalOptions,
        correctAnswer: formCorrectAnswer.trim(),
        explanation: formExplanation.trim(),
        duration: Number(formDuration) || 20,
        difficulty: formDifficulty,
        points: Number(formPoints) || 15,
      });
    } else {
      await addQuestion({
        categoryId: formCategoryId,
        question: formQuestionText.trim(),
        questionType: formQuestionType,
        options: finalOptions,
        correctAnswer: formCorrectAnswer.trim(),
        explanation: formExplanation.trim(),
        duration: Number(formDuration) || 20,
        difficulty: formDifficulty,
        points: Number(formPoints) || 15,
      });
    }

    setIsFormModalOpen(false);
  };

  // Multi-Select Handlers
  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map((q) => q.id));
    }
  };

  const handleExecuteBulkDelete = async () => {
    await deleteQuestionsBatch(selectedQuestionIds);
    setSelectedQuestionIds([]);
    setShowBulkDeleteConfirm(false);
  };

  const handleExecuteBulkMove = async () => {
    if (!bulkTargetCategoryId) return;
    for (const qId of selectedQuestionIds) {
      await updateQuestion(qId, { categoryId: bulkTargetCategoryId });
    }
    showToast(`${selectedQuestionIds.length} soal berhasil dipindahkan.`, 'success');
    setSelectedQuestionIds([]);
    setShowBulkMoveModal(false);
  };

  // Export & Import
  const handleExportJSON = () => {
    sound.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `quizku_bank_soal_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('Bank soal berhasil diekspor ke file JSON.', 'success');
  };

  const handleImportJSON = async () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Data JSON harus berupa array kumpulan soal.');
      }

      const validQs = parsed.map((item) => ({
        categoryId: categories[0]?.id || 'cat_umum',
        question: String(item.question || 'Pertanyaan Baru'),
        questionType: (item.questionType || 'multiple_choice') as QuestionType,
        options: Array.isArray(item.options) ? item.options.map(String) : ['Pilihan 1', 'Pilihan 2'],
        correctAnswer: String(item.correctAnswer || item.options?.[0] || 'Pilihan 1'),
        explanation: String(item.explanation || ''),
        duration: Number(item.duration) || 20,
        difficulty: (item.difficulty || 'Sedang') as DifficultyLevel,
        points: Number(item.points) || 15,
      }));

      if (validQs.length === 0) {
        showToast('Tidak ada soal yang valid untuk diimpor.', 'error');
        return;
      }

      await importQuestionsBatch(validQs);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (err: any) {
      showToast(`Format JSON tidak valid: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileEdit className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
            <span>Buat dan Kelola Soal</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Bank soal mandiri dengan generator AI opsi pengecoh, pemeriksaan kualitas, dan variasi soal serupa.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Impor Soal JSON"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Impor</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Ekspor Soal JSON"
          >
            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Ekspor</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pertanyaan atau kunci jawaban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Semua Kategori ({questions.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({questions.filter((q) => q.categoryId === c.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedDifficultyFilter}
              onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Semua Level</option>
              <option value="Mudah">Mudah</option>
              <option value="Sedang">Sedang</option>
              <option value="Sulit">Sulit</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="question">Abjad Soal</option>
            </select>
          </div>
        </div>

        {/* Multi-Select Action Toolbar */}
        {selectedQuestionIds.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {selectedQuestionIds.length} soal terpilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBulkTargetCategoryId(categories[0]?.id || '');
                  setShowBulkMoveModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
              >
                Pindah Kategori
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 font-semibold cursor-pointer"
              >
                Hapus Terpilih
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List Table / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                filteredQuestions.length > 0 &&
                selectedQuestionIds.length === filteredQuestions.length
              }
              onChange={handleSelectAll}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Pilih Semua ({filteredQuestions.length})</span>
          </label>
          <span>Menampilkan {filteredQuestions.length} butir soal</span>
        </div>

        {filteredQuestions.map((q) => {
          const cat = categories.find((c) => c.id === q.categoryId);
          const isSelected = selectedQuestionIds.includes(q.id);
          const isGeneratingSimilar = generatingSimilarId === q.id;

          return (
            <div
              key={q.id}
              className={`p-5 rounded-3xl border shadow-sm dark:shadow-lg transition-all ${
                isSelected
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectQuestion(q.id)}
                    className="mt-1 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase text-white shadow-xs"
                        style={{ backgroundColor: cat?.color || '#4F46E5' }}
                      >
                        {cat?.name || 'Kategori'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {q.duration}s • +{q.points} pts
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      {q.question}
                    </h3>
                  </div>
                </div>

                {/* Per-Question Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* AI Soal Serupa Button */}
                  <button
                    disabled={isGeneratingSimilar}
                    onClick={() => handleAIGenerateSimilar(q)}
                    className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Buat Soal Serupa dengan AI"
                  >
                    {isGeneratingSimilar ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    )}
                    <span className="hidden md:inline">Soal Serupa</span>
                  </button>

                  <button
                    onClick={() => duplicateQuestion(q.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Duplikasi Soal"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Soal"
                  >
                    <FileEdit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setDeleteTargetQuestion(q);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Chips */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
                {q.options?.map((opt, i) => {
                  const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                  return (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-xl font-medium border ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt} {isCorrect && '✓'}
                    </span>
                  );
                })}
              </div>

              {/* Explanation Snippet */}
              {q.explanation && (
                <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 italic">
                  💡 {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Tidak ada soal yang cocok dengan filter.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tekan "Tambah Soal Baru" atau ubah kata kunci pencarian.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingQuestion ? 'Edit Butir Soal' : 'Tambah Soal Baru'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kategori Soal <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Jenis Soal</label>
              <select
                value={formQuestionType}
                onChange={(e) => setFormQuestionType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="multiple_choice">Pilihan Ganda (Default)</option>
                <option value="true_false">Benar / Salah</option>
                <option value="short_answer">Jawaban Singkat</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Teks Pertanyaan <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                disabled={isReviewingQuality}
                onClick={handleAIReviewQuality}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {isReviewingQuality ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>✨ Periksa Kualitas dengan AI</span>
              </button>
            </div>
            <textarea
              rows={3}
              required
              value={formQuestionText}
              onChange={(e) => setFormQuestionText(e.target.value)}
              placeholder="Tuliskan pertanyaan quiz di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Quality Review Results Display */}
          {aiReviewResult && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Hasil Review Kualitas AI:</span>
              </div>
              {aiReviewResult.issues && aiReviewResult.issues.length > 0 ? (
                <ul className="list-disc list-inside text-rose-600 dark:text-rose-300 space-y-1">
                  {aiReviewResult.issues.map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-700 dark:text-emerald-300">✓ Pertanyaan jelas dan tidak ada masalah kritis terdeteksi.</p>
              )}
              {aiReviewResult.suggestions && aiReviewResult.suggestions.length > 0 && (
                <div className="text-slate-700 dark:text-slate-300">
                  <strong>Saran:</strong> {aiReviewResult.suggestions.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Multiple Choice Options Builder */}
          {formQuestionType === 'multiple_choice' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilihan Jawaban (Tandai yang Benar) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  disabled={isGeneratingOptions}
                  onClick={handleAIGenerateOptions}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  {isGeneratingOptions ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  )}
                  <span>✨ Bantu AI Membuat Opsi</span>
                </button>
              </div>

              <div className="space-y-2">
                {formOptions.map((opt, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isCorrect = formCorrectAnswer === opt && opt.trim() !== '';

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer(opt)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Tandai sebagai jawaban benar"
                      >
                        {isCorrect ? <Check className="w-4 h-4" /> : label}
                      </button>

                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleOptionChange(idx, val);
                          if (formCorrectAnswer === opt) {
                            setFormCorrectAnswer(val);
                          }
                        }}
                        placeholder={`Pilihan ${label}`}
                        className={`flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none ${
                          isCorrect ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />

                      {formOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {formOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold cursor-pointer"
                >
                  + Tambah Pilihan Jawaban
                </button>
              )}
            </div>
          )}

          {/* True / False Options */}
          {formQuestionType === 'true_false' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Kunci Jawaban Benar</label>
              <div className="flex gap-3">
                {['Benar', 'Salah'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormCorrectAnswer(val)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formCorrectAnswer === val
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Short Answer Input */}
          {formQuestionType === 'short_answer' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kunci Jawaban Tepat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formCorrectAnswer}
                onChange={(e) => setFormCorrectAnswer(e.target.value)}
                placeholder="Jawaban teks yang diharapkan..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Penjelasan Jawaban (Pembahasan)
            </label>
            <textarea
              rows={2}
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              placeholder="Berikan langkah penalaran atau referensi pembuktian..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Settings Grid: Duration, Difficulty, Points */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Durasi (detik)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Kesulitan</label>
              <select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Poin</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formPoints}
                onChange={(e) => setFormPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              {editingQuestion ? 'Simpan Perubahan' : 'Tambahkan Soal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Move Category Modal */}
      <Modal
        isOpen={showBulkMoveModal}
        onClose={() => setShowBulkMoveModal(false)}
        title={`Pindahkan ${selectedQuestionIds.length} Soal`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">Pilih kategori tujuan untuk soal yang dipilih:</p>
          <select
            value={bulkTargetCategoryId}
            onChange={(e) => setBulkTargetCategoryId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowBulkMoveModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              onClick={handleExecuteBulkMove}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow"
            >
              Pindahkan
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleExecuteBulkDelete}
        title={`Hapus ${selectedQuestionIds.length} Soal?`}
        message="Soal yang dihapus tidak dapat dipulihkan kembali."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      {/* Single Question Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTargetQuestion}
        onClose={() => setDeleteTargetQuestion(null)}
        onConfirm={() => {
          if (deleteTargetQuestion) {
            deleteQuestion(deleteTargetQuestion.id);
            setDeleteTargetQuestion(null);
          }
        }}
        title="Hapus Soal Ini?"
        message="Soal ini akan dihapus dari bank soal quiz."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Soal (JSON Format)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Tempelkan data soal dalam format JSON array yang valid. Contoh format:
            <code className="block mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-indigo-700 dark:text-cyan-300 overflow-x-auto border border-slate-200 dark:border-slate-800">
              {`[
  {
    "question": "Berapakah 5 + 7?",
    "options": ["10", "11", "12", "13"],
    "correctAnswer": "12",
    "explanation": "5 ditambah 7 adalah 12."
  }
]`}
            </code>
          </p>

          <textarea
            rows={8}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Tempel JSON di sini..."
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              onClick={handleImportJSON}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
            >
              Proses Impor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
