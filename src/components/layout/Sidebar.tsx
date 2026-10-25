import React from 'react';
import { useApp, NavigationPage } from '../../context/AppContext';
import {
  Home,
  PlayCircle,
  FolderKanban,
  FileEdit,
  Sparkles,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { sound } from '../../lib/audio';

interface Props {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { activePage, setActivePage, profile, questions } = useApp();

  const navItems: { id: NavigationPage; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'play', label: 'Play / Latihan Quiz', icon: PlayCircle },
    { id: 'koleksi', label: 'Koleksi Quiz', icon: FolderKanban },
    { id: 'kelola-soal', label: 'Buat dan Kelola Soal', icon: FileEdit, badge: `${questions.length}` },
    { id: 'ai-generator', label: 'AI Quiz Generator', icon: Sparkles, badge: 'AI' },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
    { id: 'tentang', label: 'Tentang QuizKu', icon: Info },
  ];

  const handleNavClick = (id: NavigationPage) => {
    sound.playClick();
    setActivePage(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-61px)] flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out shadow-xs dark:shadow-none ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top: Mobile header & Navigation Items */}
        <div className="flex flex-col flex-1 overflow-y-auto px-3 py-4">
          {/* Mobile Only Header inside Drawer */}
          <div className="flex items-center justify-between px-3 mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="QuizKu" className="w-8 h-8 rounded-xl" />
              <span className="font-black text-lg text-slate-900 dark:text-white">QuizKu</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links in Strict Order (Statistik & Riwayat removed) */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  } ${isCollapsed ? 'lg:justify-center lg:px-2.5' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'scale-110 text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  />
                  {(!isCollapsed || mobileOpen) && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {item.badge && (!isCollapsed || mobileOpen) && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'AI'
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator Bar on collapsed desktop */}
                  {isActive && isCollapsed && (
                    <span className="hidden lg:block absolute left-1 w-1 h-6 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Streak & Desktop Collapse Toggle */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {/* Learning Streak Badge */}
          {(!isCollapsed || mobileOpen) && (
            <div className="mb-3 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-300 uppercase tracking-wider">
                    Belajar Streak
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                    {profile?.streak || 1} Hari Beruntun!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Collapse / Expand Button */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleCollapse();
            }}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-medium"
            title={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Kecilkan Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
