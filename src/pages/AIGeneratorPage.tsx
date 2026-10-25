import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DifficultyLevel, Question } from '../types';
import { sound } from '../lib/audio';
import {
  Sparkles,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Check,
} from 'lucide-react';

export const AIGeneratorPage: React.FC = () => {
  const { categories, addQuestion, showToast, setActivePage } = useApp();

  // Generator Form Controls
  const [topic, setTopic] = useState('Tata Surya dan Planet');
  const [targetCategoryId, setTargetCategoryId] = useState(categories[0]?.id || '');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Sedang');
  const [optionCount, setOptionCount] = useState(4);
  const [duration, setDuration] = useState(20);
  const [language, setLanguage] = useState('Bahasa Indonesia');
  const [referenceText, setReferenceText] = useState('');

  // AI Loading & Preview State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Handle Generate API Call
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Masukkan topik quiz yang ingin dibuat.', 'error');
      return;
    }

    setIsGenerating(true);
    sound.playClick();

    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          category: categories.find((c) => c.id === targetCategoryId)?.name || 'Umum',
          count: Math.min(25, Math.max(1, count)),
          difficulty,
          optionCount,
          duration,
          language,
          referenceText: referenceText.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghasilkan kumpulan soal quiz.');
      }

      if (data.questions && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        setSelectedIndices(data.questions.map((_: any, idx: number) => idx));
        showToast(`AI berhasil merancang ${data.questions.length} butir soal!`, 'success');
        sound.playVictory();
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal memproses pembuatan soal dengan AI.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Remove question from preview
  const handleRemoveItem = (idx: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIndices((prev) =>
      prev.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i))
    );
  };

  // Save selected questions to Category
  const handleSaveToCategory = async () => {
    if (selectedIndices.length === 0) {
      showToast('Pilih minimal satu soal untuk disimpan.', 'error');
      return;
    }

    setIsSaving(true);
    sound.playClick();

    const questionsToSave = generatedQuestions.filter((_, idx) =>
      selectedIndices.includes(idx)
    );

    let savedCount = 0;
    for (const q of questionsToSave) {
      await addQuestion({
        categoryId: targetCategoryId || categories[0]?.id || 'cat_umum',
        question: q.question,
        questionType: 'multiple_choice',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        duration: q.duration || duration,
        difficulty: q.difficulty || difficulty,
        points: q.points || 15,
      });
      savedCount++;
    }

    setIsSaving(false);
    showToast(`Berhasil menyimpan ${savedCount} soal ke koleksi!`, 'success');
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    setActivePage('kelola-soal');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>AI Quiz Generator</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Buat otomatis hingga 25 butir soal lengkap dengan pilihan pengecoh, kunci jawaban, dan pembahasan.
          </p>
        </div>
      </div>

      {/* Generator Configuration Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-2xl">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Topic Input */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Topik / Materi Quiz <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Misal: Operasi Perkalian Dua Digit, Sejarah Kemerdekaan RI, Hukum Gravitasi..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-purple-500 shadow-inner"
              />
            </div>

            {/* Target Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kategori Tujuan
              </label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Count Slider (max 25) */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Jumlah Soal</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold">{count} Butir</span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>1 Soal</span>
                <span>Maks. 25 Soal</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>

            {/* Option Count per Question */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Jumlah Opsi Pilihan
              </label>
              <select
                value={optionCount}
                onChange={(e) => setOptionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
              >
                <option value={3}>3 Pilihan (A, B, C)</option>
                <option value={4}>4 Pilihan (A, B, C, D) [Standar]</option>
                <option value={5}>5 Pilihan (A, B, C, D, E)</option>
              </select>
            </div>

            {/* Duration per question */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Durasi Timer (detik/soal)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bahasa Soal</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          {/* Optional Reference Material */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Materi / Teks Referensi Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="Tempelkan ringkasan materi, paragraf bacaan, atau rumus yang ingin dijadikan acuan pembuatan soal..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI Sedang Merancang Soal Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>HASILKAN {count} SOAL DENGAN AI</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Results Preview Section */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>Pratinjau Hasil AI ({generatedQuestions.length} Soal)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centang soal yang ingin disimpan, lalu klik Simpan ke Koleksi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isSaving || selectedIndices.length === 0}
                onClick={handleSaveToCategory}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Simpan {selectedIndices.length} Soal</span>
              </button>
            </div>
          </div>

          {/* Question Cards Preview */}
          <div className="space-y-3">
            {generatedQuestions.map((q, idx) => {
              const isSelected = selectedIndices.includes(idx);

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border transition-all ${
                    isSelected
                      ? 'bg-purple-50/50 dark:bg-slate-900 border-purple-400 dark:border-purple-500/50 shadow-md'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(idx)}
                        className="mt-1 rounded text-purple-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            Soal #{idx + 1}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                          {q.question}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="Hapus dari daftar ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                      return (
                        <span
                          key={oIdx}
                          className={`px-3 py-1 rounded-xl font-medium border ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt} {isCorrect && '✓'}
                        </span>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      💡 <strong>Penjelasan:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
