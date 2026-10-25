import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Category,
  Question,
  QuizHistory,
  UserProfile,
  UserSettings,
  QuizMode,
} from '../types';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { QuizStorage } from '../lib/storage';
import { sound } from '../lib/audio';
import { DEFAULT_SETTINGS } from '../lib/defaultData';

export type NavigationPage =
  | 'beranda'
  | 'play'
  | 'koleksi'
  | 'kelola-soal'
  | 'ai-generator'
  | 'pengaturan'
  | 'tentang';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  currentUser: User | null;
  profile: UserProfile | null;
  categories: Category[];
  questions: Question[];
  history: QuizHistory[];
  settings: UserSettings;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'pending';
  isOnline: boolean;
  selectedCategoryForPlay: Category | null;
  selectedModeForPlay: QuizMode;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Auth actions
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;

  // Navigation & Play actions
  startQuizSession: (category: Category, mode?: QuizMode) => void;

  // CRUD Category
  addCategory: (cat: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string, moveToCategoryId?: string) => Promise<void>;
  toggleFavoriteCategory: (id: string) => Promise<void>;

  // CRUD Question
  addQuestion: (q: Omit<Question, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Question>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  deleteQuestionsBatch: (ids: string[]) => Promise<void>;
  duplicateQuestion: (id: string) => Promise<Question | null>;
  importQuestionsBatch: (newQuestions: Omit<Question, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;

  // Quiz Results
  saveQuizHistory: (hist: Omit<QuizHistory, 'id' | 'userId'>) => Promise<QuizHistory>;
  clearAllHistory: () => Promise<void>;

  // Settings
  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('beranda');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'pending'>('synced');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [selectedCategoryForPlay, setSelectedCategoryForPlay] = useState<Category | null>(null);
  const [selectedModeForPlay, setSelectedModeForPlay] = useState<QuizMode>('challenge');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync Audio Settings
  useEffect(() => {
    sound.setSettings(settings.soundEnabled, settings.soundVolume);
    if (settings.bgMusicEnabled && settings.soundEnabled) {
      sound.startBgMusic();
    } else {
      sound.stopBgMusic();
    }
  }, [settings.soundEnabled, settings.soundVolume, settings.bgMusicEnabled]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
      showToast('Koneksi internet terhubung kembali.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showToast('Mode offline aktif — data tersimpan di penyimpanan lokal.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Apply Theme to documentElement & Listen to System Preference
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let isDark = false;
      if (settings.colorMode === 'dark') {
        isDark = true;
      } else if (settings.colorMode === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    // Set Theme Accent CSS Variables
    const themeColors: Record<string, { primary: string; accent: string }> = {
      blue: { primary: '#2563EB', accent: '#38BDF8' },
      purple: { primary: '#7C3AED', accent: '#C084FC' },
      green: { primary: '#059669', accent: '#34D399' },
      orange: { primary: '#EA580C', accent: '#FDBA74' },
      pink: { primary: '#DB2777', accent: '#F472B6' },
      cyan: { primary: '#0891B2', accent: '#67E8F9' },
      black: { primary: '#1E293B', accent: '#94A3B8' },
      custom: { primary: settings.customColor, accent: settings.customAccent },
    };

    const chosen = themeColors[settings.themePreset] || themeColors.purple;
    root.style.setProperty('--color-brand-primary', chosen.primary);
    root.style.setProperty('--color-brand-accent', chosen.accent);

    // If mode is 'system', dynamically listen to browser/OS theme changes
    if (settings.colorMode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings.themePreset, settings.colorMode, settings.customColor, settings.customAccent]);

  // Initial Data Load
  useEffect(() => {
    async function loadData() {
      const initial = await QuizStorage.loadLocalData();
      setCategories(initial.categories);
      setQuestions(initial.questions);
      setHistory(initial.history);
      if (initial.settings) setSettings(initial.settings);
      if (initial.profile) setProfile(initial.profile);
    }
    loadData();
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('syncing');
        try {
          const cloudData = await QuizStorage.syncFromCloud(user.uid);
          if (cloudData) {
            if (cloudData.categories) setCategories(cloudData.categories);
            if (cloudData.questions) setQuestions(cloudData.questions);
            if (cloudData.history) setHistory(cloudData.history);
          }
          setSyncStatus('synced');
          showToast(`Berhasil masuk sebagai ${user.displayName || user.email}`, 'success');
        } catch (err) {
          console.error('Error syncing cloud on login:', err);
          setSyncStatus('pending');
        }
      } else {
        setSyncStatus(isOnline ? 'synced' : 'offline');
      }
    });

    return () => unsubscribe();
  }, [isOnline, showToast]);

  // Google Login
  const loginWithGoogle = async () => {
    try {
      sound.playClick();
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      showToast(`Gagal login dengan Google: ${err.message}`, 'error');
    }
  };

  // Logout
  const logoutUser = async () => {
    try {
      sound.playClick();
      await signOut(auth);
      setCurrentUser(null);
      showToast('Berhasil keluar dari akun.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Start Quiz
  const startQuizSession = (category: Category, mode: QuizMode = 'challenge') => {
    sound.playClick();
    setSelectedCategoryForPlay(category);
    setSelectedModeForPlay(mode);
    setActivePage('play');
  };

  // Category Actions
  const addCategory = async (catData: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = currentUser ? currentUser.uid : 'local_user';
    const newCategory: Category = {
      ...catData,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextCats = [...categories, newCategory];
    setCategories(nextCats);
    await QuizStorage.saveCategory(newCategory, currentUser?.uid);
    showToast(`Kategori "${newCategory.name}" berhasil dibuat!`, 'success');
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    setCategories(updated);
    const catToSave = updated.find((c) => c.id === id);
    if (catToSave) {
      await QuizStorage.saveCategory(catToSave, currentUser?.uid);
      showToast('Kategori berhasil diperbarui.', 'success');
    }
  };

  const deleteCategory = async (id: string, moveToCategoryId?: string) => {
    // Reassign or delete associated questions
    if (moveToCategoryId) {
      const movedQuestions = questions.map((q) => (q.categoryId === id ? { ...q, categoryId: moveToCategoryId } : q));
      setQuestions(movedQuestions);
      const toUpdate = movedQuestions.filter((q) => q.categoryId === moveToCategoryId);
      await QuizStorage.saveQuestionsBatch(toUpdate, currentUser?.uid);
    } else {
      const remainingQuestions = questions.filter((q) => q.categoryId !== id);
      const removedIds = questions.filter((q) => q.categoryId === id).map((q) => q.id);
      setQuestions(remainingQuestions);
      if (removedIds.length > 0) {
        await QuizStorage.deleteQuestionsBatch(removedIds, currentUser?.uid);
      }
    }

    const nextCats = categories.filter((c) => c.id !== id);
    setCategories(nextCats);
    await QuizStorage.deleteCategory(id, currentUser?.uid);
    showToast('Kategori berhasil dihapus.', 'info');
  };

  const toggleFavoriteCategory = async (id: string) => {
    sound.playClick();
    const updated = categories.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
    setCategories(updated);
    const target = updated.find((c) => c.id === id);
    if (target) {
      await QuizStorage.saveCategory(target, currentUser?.uid);
    }
  };

  // Question Actions
  const addQuestion = async (qData: Omit<Question, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = currentUser ? currentUser.uid : 'local_user';
    const newQ: Question = {
      ...qData,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuestions((prev) => [newQ, ...prev]);
    await QuizStorage.saveQuestion(newQ, currentUser?.uid);
    showToast('Soal berhasil disimpan!', 'success');
    return newQ;
  };

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    const updated = questions.map((q) => (q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q));
    setQuestions(updated);
    const qToSave = updated.find((q) => q.id === id);
    if (qToSave) {
      await QuizStorage.saveQuestion(qToSave, currentUser?.uid);
      showToast('Perubahan soal tersimpan.', 'success');
    }
  };

  const deleteQuestion = async (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    await QuizStorage.deleteQuestion(id, currentUser?.uid);
    showToast('Soal berhasil dihapus.', 'info');
  };

  const deleteQuestionsBatch = async (ids: string[]) => {
    setQuestions((prev) => prev.filter((q) => !ids.includes(q.id)));
    await QuizStorage.deleteQuestionsBatch(ids, currentUser?.uid);
    showToast(`${ids.length} soal berhasil dihapus.`, 'info');
  };

  const duplicateQuestion = async (id: string) => {
    sound.playClick();
    const target = questions.find((q) => q.id === id);
    if (!target) return null;

    const dupId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: Question = {
      ...target,
      id: dupId,
      question: `${target.question} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuestions((prev) => [duplicated, ...prev]);
    await QuizStorage.saveQuestion(duplicated, currentUser?.uid);
    showToast('Soal berhasil diduplikasi.', 'success');
    return duplicated;
  };

  const importQuestionsBatch = async (newQs: Omit<Question, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => {
    const userId = currentUser ? currentUser.uid : 'local_user';
    const formatted: Question[] = newQs.map((q, idx) => ({
      ...q,
      id: `q_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setQuestions((prev) => [...formatted, ...prev]);
    await QuizStorage.saveQuestionsBatch(formatted, currentUser?.uid);
    showToast(`Berhasil mengimpor ${formatted.length} butir soal!`, 'success');
    return formatted.length;
  };

  // Quiz Results & Streak calculation
  const saveQuizHistory = async (histData: Omit<QuizHistory, 'id' | 'userId'>) => {
    const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = currentUser ? currentUser.uid : 'local_user';
    const newHist: QuizHistory = {
      ...histData,
      id,
      userId,
    };

    const nextHistory = [newHist, ...history];
    setHistory(nextHistory);
    await QuizStorage.saveHistory(newHist, currentUser?.uid);

    // Update Profile Streak & Aggregates
    const today = new Date().toISOString().split('T')[0];
    const prevStreak = profile?.streak || 0;
    const lastActive = profile?.lastActiveDate || '';

    let nextStreak = prevStreak;
    if (!lastActive) {
      nextStreak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const diffDays = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        nextStreak = prevStreak + 1;
      } else if (diffDays > 1) {
        nextStreak = 1;
      }
    }

    const nextProfile: UserProfile = {
      uid: userId,
      displayName: currentUser?.displayName || 'Quiz Master',
      email: currentUser?.email || '',
      photoURL: currentUser?.photoURL || undefined,
      streak: nextStreak,
      lastActiveDate: today,
      totalPlayed: (profile?.totalPlayed || 0) + 1,
      totalCorrect: (profile?.totalCorrect || 0) + newHist.correctAnswers,
      totalIncorrect: (profile?.totalIncorrect || 0) + newHist.incorrectAnswers,
      bestScore: Math.max(profile?.bestScore || 0, newHist.score),
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProfile(nextProfile);
    await QuizStorage.saveProfile(nextProfile, currentUser?.uid);

    return newHist;
  };

  const clearAllHistory = async () => {
    setHistory([]);
    await QuizStorage.clearHistory(currentUser?.uid);
    showToast('Seluruh riwayat quiz berhasil dihapus.', 'info');
  };

  // Settings
  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    setSettings(updated);
    await QuizStorage.saveSettings(updated, currentUser?.uid);
    showToast('Pengaturan berhasil diperbarui.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        currentUser,
        profile,
        categories,
        questions,
        history,
        settings,
        syncStatus,
        isOnline,
        selectedCategoryForPlay,
        selectedModeForPlay,
        toasts,
        showToast,
        dismissToast,
        loginWithGoogle,
        logoutUser,
        startQuizSession,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleFavoriteCategory,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        deleteQuestionsBatch,
        duplicateQuestion,
        importQuestionsBatch,
        saveQuizHistory,
        clearAllHistory,
        updateUserSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
