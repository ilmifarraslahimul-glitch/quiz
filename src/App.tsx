/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { PlayQuizPage } from './pages/PlayQuizPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { QuestionsManagerPage } from './pages/QuestionsManagerPage';
import { AIGeneratorPage } from './pages/AIGeneratorPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { activePage, isOnline, toasts, dismissToast } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'beranda':
        return <HomePage />;
      case 'play':
        return <PlayQuizPage />;
      case 'koleksi':
        return <CategoriesPage />;
      case 'kelola-soal':
        return <QuestionsManagerPage />;
      case 'ai-generator':
        return <AIGeneratorPage />;
      case 'pengaturan':
        return <SettingsPage />;
      case 'tentang':
        return <AboutPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

      {/* Main Body Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Offline Mode Banner if disconnected */}
          {!isOnline && (
            <div className="mb-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Mode Offline: Anda tetap dapat bermain kuis dari bank soal lokal.</span>
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400/80 hidden sm:inline">
                Akan otomatis tersinkron saat internet tersambung
              </span>
            </div>
          )}

          {/* Active Page View */}
          <div className="animate-in fade-in duration-150">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Global Toast Notification System */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-xs font-semibold ${
                t.type === 'success'
                  ? 'bg-white/95 dark:bg-slate-900/90 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : t.type === 'error'
                  ? 'bg-white/95 dark:bg-slate-900/90 border-rose-500/40 text-rose-700 dark:text-rose-300'
                  : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />}

              <span className="flex-1 leading-snug">{t.message}</span>

              <button
                onClick={() => dismissToast(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
