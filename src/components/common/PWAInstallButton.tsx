import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { sound } from '../../lib/audio';

interface Props {
  variant?: 'navbar' | 'prominent' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running inside standalone app
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    sound.playClick();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // Render for Chromium / Android / Desktop or iOS guide
  if (!isInstallable && !isIOS) {
    if (variant === 'navbar') return null;
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
        <Smartphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
        <span>Gunakan browser Chrome / Edge untuk menginstal QuizKu di perangkat Anda.</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          title="Install QuizKu ke Perangkat"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install QuizKu</span>
        </button>
      )}

      {variant === 'prominent' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-98 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Install Aplikasi QuizKu (PWA)</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-600/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mainkan Sebagai Aplikasi</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Akses instan dari layar utama & dukungan offline</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            Install
          </button>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                ?
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Install QuizKu di iOS</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">iPhone / iPad Safari</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di menu bawah Safari.
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Gulir ke bawah dan pilih opsi <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Ketuk <strong>Add</strong> di pojok kanan atas. Ikon QuizKu akan muncul di layar utama Anda!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
