import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, DifficultyLevel } from '../types';
import { Modal } from '../components/common/Modal';
import { sound } from '../lib/audio';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Star,
  Clock,
  HelpCircle,
  Play,
  Layers,
  BookOpen,
  Brain,
  Sparkles,
  Target,
  Trophy,
  Code,
  Calculator,
  Palette,
  Globe,
  Flame,
  AlertTriangle,
} from 'lucide-react';

const ICON_OPTIONS = [
  { id: 'Layers', label: 'Lapisan', icon: Layers },
  { id: 'BookOpen', label: 'Buku', icon: BookOpen },
  { id: 'Brain', label: 'Otak', icon: Brain },
  { id: 'Sparkles', label: 'Sains', icon: Sparkles },
  { id: 'Target', label: 'Target', icon: Target },
  { id: 'Trophy', label: 'Prestasi', icon: Trophy },
  { id: 'Code', label: 'Koding', icon: Code },
  { id: 'Calculator', label: 'Hitung', icon: Calculator },
  { id: 'Palette', label: 'Seni', icon: Palette },
  { id: 'Globe', label: 'Geografi', icon: Globe },
  { id: 'Flame', label: 'Tantangan', icon: Flame },
];

export const CategoriesPage: React.FC = () => {
  const {
    categories,
    questions,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleFavoriteCategory,
    startQuizSession,
    showToast,
  } = useApp();

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [color, setColor] = useState('#4F46E5');
  const [defaultDuration, setDefaultDuration] = useState(20);
  const [defaultQuestionsPerSession, setDefaultQuestionsPerSession] = useState(10);
  const [defaultDifficulty, setDefaultDifficulty] = useState<DifficultyLevel>('Sedang');
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [reassignCategoryChoice, setReassignCategoryChoice] = useState<string>('delete'); // 'delete' or categoryId

  // Color Preset Palette
  const colorPresets = [
    '#4F46E5', // Indigo
    '#7C3AED', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#14B8A6', // Teal
  ];

  const handleOpenAdd = () => {
    sound.playClick();
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIcon('Layers');
    setColor('#4F46E5');
    setDefaultDuration(20);
    setDefaultQuestionsPerSession(10);
    setDefaultDifficulty('Sedang');
    setPointsPerQuestion(10);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    sound.playClick();
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setIcon(cat.icon || 'Layers');
    setColor(cat.color || '#4F46E5');
    setDefaultDuration(cat.defaultDuration || 20);
    setDefaultQuestionsPerSession(cat.defaultQuestionsPerSession || 10);
    setDefaultDifficulty(cat.defaultDifficulty || 'Sedang');
    setPointsPerQuestion(cat.pointsPerQuestion || 10);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama kategori wajib diisi.', 'error');
      return;
    }

    sound.playClick();

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        defaultDuration: Number(defaultDuration) || 20,
        defaultQuestionsPerSession: Number(defaultQuestionsPerSession) || 10,
        defaultDifficulty,
        pointsPerQuestion: Number(pointsPerQuestion) || 10,
      });
    } else {
      await addCategory({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        defaultDuration: Number(defaultDuration) || 20,
        defaultQuestionsPerSession: Number(defaultQuestionsPerSession) || 10,
        defaultDifficulty,
        pointsPerQuestion: Number(pointsPerQuestion) || 10,
        order: categories.length + 1,
        isArchived: false,
        isFavorite: false,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    sound.playClick();
    const moveTo = reassignCategoryChoice === 'delete' ? undefined : reassignCategoryChoice;
    await deleteCategory(deleteTarget.id, moveTo);
    setDeleteTarget(null);
  };

  // Helper to render icon component dynamically
  const renderCategoryIcon = (iconName: string, className = 'w-6 h-6') => {
    const found = ICON_OPTIONS.find((item) => item.id === iconName);
    const Comp = found ? found.icon : Layers;
    return <Comp className={className} />;
  };

  const targetCategoryQuestionCount = deleteTarget
    ? questions.filter((q) => q.categoryId === deleteTarget.id).length
    : 0;

  const otherCategories = deleteTarget
    ? categories.filter((c) => c.id !== deleteTarget.id)
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-indigo-500 dark:text-purple-400" />
            <span>Koleksi Kategori Quiz</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Kelola, kustomisasi nama, warna, ikon, durasi, dan tingkat kesulitan setiap topik quiz.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Kategori</span>
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = questions.filter((q) => q.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className={`p-5 rounded-3xl border shadow-md dark:shadow-xl flex flex-col justify-between relative overflow-hidden transition-all ${
                cat.isArchived
                  ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Top Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: cat.color || '#4F46E5' }}
              />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: cat.color || '#4F46E5' }}
                  >
                    {renderCategoryIcon(cat.icon)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoriteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                      title={cat.isFavorite ? 'Hapus Favorit' : 'Tandai Favorit'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          cat.isFavorite ? 'fill-amber-400 text-amber-500 dark:text-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setDeleteTarget(cat);
                        setReassignCategoryChoice('delete');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{cat.name}</h3>
                  {cat.isArchived && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold">
                      Arsip
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.description || 'Kategori latihan soal interaktif.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    {count} Soal
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    {cat.defaultDuration}s
                  </span>
                </div>

                <button
                  disabled={count === 0}
                  onClick={() => startQuizSession(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    count === 0
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Main</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Belum ada kategori</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Mulai dengan menambahkan kategori baru untuk mengatur kumpulan soal quiz kamu.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            + Tambah Kategori
          </button>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Kategori Quiz' : 'Buat Kategori Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Trigonometri, Fisika Dasar, Sejarah Dunia"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan cakupan materi quiz ini..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Pilih Ikon Kategori
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={item.label}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection with Color Picker & Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Warna Kategori
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-transform cursor-pointer ${
                    color === c
                      ? 'scale-115 ring-2 ring-indigo-500 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{color}</span>
              </div>
            </div>
          </div>

          {/* Grid Settings: Duration & Difficulty */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Durasi Default (detik)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={defaultDifficulty}
                onChange={(e) => setDefaultDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal with "Batal" and "Ya, Hapus" */}
      {deleteTarget && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title={`Hapus Kategori "${deleteTarget.name}"?`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            {targetCategoryQuestionCount === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori <strong>{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    Kategori ini masih memiliki{' '}
                    <strong>{targetCategoryQuestionCount} butir soal</strong>. Tentukan tindakan untuk soal-soal tersebut:
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="reassign"
                      value="delete"
                      checked={reassignCategoryChoice === 'delete'}
                      onChange={() => setReassignCategoryChoice('delete')}
                      className="mt-0.5 text-rose-600"
                    />
                    <div className="text-xs">
                      <strong className="text-rose-600 dark:text-rose-400 block font-bold">
                        Hapus semua soal di kategori ini
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {targetCategoryQuestionCount} butir soal terkait akan dihapus secara permanen.
                      </span>
                    </div>
                  </label>

                  {otherCategories.length > 0 && (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="reassign"
                        value="reassign"
                        checked={reassignCategoryChoice !== 'delete'}
                        onChange={() => {
                          const firstOther = otherCategories[0];
                          if (firstOther) setReassignCategoryChoice(firstOther.id);
                        }}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div className="text-xs flex-1">
                        <strong className="text-slate-900 dark:text-white block font-bold">
                          Pindahkan soal ke kategori lain
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 block mb-1">
                          Pindahkan {targetCategoryQuestionCount} soal ke:
                        </span>
                        <select
                          value={reassignCategoryChoice === 'delete' ? '' : reassignCategoryChoice}
                          onChange={(e) => setReassignCategoryChoice(e.target.value)}
                          disabled={reassignCategoryChoice === 'delete'}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs disabled:opacity-50"
                        >
                          {otherCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
