import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ThemePreset, ColorMode } from '../types';
import { sound } from '../lib/audio';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import {
  Settings,
  Palette,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Clock,
  Smartphone,
  Download,
  Check,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateUserSettings, categories, questions, history, showToast } = useApp();

  const [customPrimary, setCustomPrimary] = useState(settings.customColor || '#4F46E5');
  const [customAccent, setCustomAccent] = useState(settings.customAccent || '#06B6D4');

  const themePresets: { id: ThemePreset; name: string; color: string; accent: string }[] = [
    { id: 'purple', name: 'Ungu Elegan', color: '#7C3AED', accent: '#C084FC' },
    { id: 'blue', name: 'Biru Samudera', color: '#2563EB', accent: '#38BDF8' },
    { id: 'green', name: 'Hijau Zamrud', color: '#059669', accent: '#34D399' },
    { id: 'orange', name: 'Oranye Hangat', color: '#EA580C', accent: '#FDBA74' },
    { id: 'pink', name: 'Pink Ceria', color: '#DB2777', accent: '#F472B6' },
    { id: 'cyan', name: 'Cyan Neon', color: '#0891B2', accent: '#67E8F9' },
    { id: 'black', name: 'Hitam Modern', color: '#1E293B', accent: '#94A3B8' },
    { id: 'custom', name: 'Kustom Sendiri', color: customPrimary, accent: customAccent },
  ];

  const handleSelectPreset = (preset: ThemePreset) => {
    sound.playClick();
    updateUserSettings({ themePreset: preset });
  };

  const handleSelectColorMode = (mode: ColorMode) => {
    sound.playClick();
    updateUserSettings({ colorMode: mode });
    if (mode === 'light') {
      showToast('Mode Terang diaktifkan.', 'info');
    } else if (mode === 'dark') {
      showToast('Mode Gelap diaktifkan.', 'info');
    } else {
      showToast('Mode Sistem Bawaan diaktifkan.', 'info');
    }
  };

  const handleVolumeChange = (vol: number) => {
    updateUserSettings({ soundVolume: vol });
  };

  const handleApplyCustomColors = () => {
    sound.playClick();
    updateUserSettings({
      themePreset: 'custom',
      customColor: customPrimary,
      customAccent,
    });
    showToast('Warna kustom berhasil diterapkan!', 'success');
  };

  // Full App Backup Download
  const handleExportFullBackup = () => {
    sound.playClick();
    const backupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      categories,
      questions,
      history,
      settings,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `quizku_backup_lengkap_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('File backup lengkap berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 transition-colors">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
          <span>Pengaturan QuizKu</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
          Kustomisasi tema warna, mode tampilan, suara, gameplay timer, dan cadangan data.
        </p>
      </div>

      {/* Theme Presets */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Tema Warna Aplikasi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {themePresets.map((t) => {
            const isSelected = settings.themePreset === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectPreset(t.id)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800 border-indigo-500 dark:border-white ring-2 ring-indigo-500/20 dark:ring-white/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-white" />}
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers */}
        {settings.themePreset === 'custom' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Warna Utama:</span>
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-slate-500 dark:text-slate-400">{customPrimary}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Warna Aksen:</span>
              <input
                type="color"
                value={customAccent}
                onChange={(e) => setCustomAccent(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-slate-500 dark:text-slate-400">{customAccent}</span>
            </div>

            <button
              onClick={handleApplyCustomColors}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Terapkan Warna
            </button>
          </div>
        )}
      </section>

      {/* Display Mode (Light, Dark, System) */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mode Tampilan (Theme)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih tema tampilan yang nyaman untuk matamu. Perubahan berlaku langsung di seluruh website.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleSelectColorMode('dark')}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer relative ${
              settings.colorMode === 'dark'
                ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-700 dark:text-white ring-2 ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-bold">Dark Mode</span>
            {settings.colorMode === 'dark' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">Aktif</span>
            )}
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => handleSelectColorMode('light')}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer relative ${
              settings.colorMode === 'light'
                ? 'bg-amber-50 dark:bg-indigo-600/20 border-amber-500 dark:border-indigo-500 text-amber-800 dark:text-white ring-2 ring-amber-500/20 dark:ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">Light Mode</span>
            {settings.colorMode === 'light' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-semibold">Aktif</span>
            )}
          </button>

          {/* System Default */}
          <button
            type="button"
            onClick={() => handleSelectColorMode('system')}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer relative ${
              settings.colorMode === 'system'
                ? 'bg-cyan-50 dark:bg-indigo-600/20 border-cyan-500 dark:border-indigo-500 text-cyan-800 dark:text-white ring-2 ring-cyan-500/20 dark:ring-indigo-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-bold">System Default</span>
            {settings.colorMode === 'system' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-600 text-white font-semibold">Aktif</span>
            )}
          </button>
        </div>
      </section>

      {/* Audio and Game Experience Settings */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Suara & Musik Latar</span>
        </h3>

        <div className="space-y-4 text-xs">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Efek Suara (Sound Effects)</div>
              <div className="text-slate-500 dark:text-slate-400">Putar suara saat menjawab benar, salah, atau hitung mundur</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                updateUserSettings({ soundEnabled: !settings.soundEnabled });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          {settings.soundEnabled && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Volume Suara</span>
                <span>{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.soundVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}

          {/* Background Music Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Musik Latar Suasana (BGM)</div>
              <div className="text-slate-500 dark:text-slate-400">Melodi lembut yang disintesis secara ceria saat bermain</div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                updateUserSettings({ bgMusicEnabled: !settings.bgMusicEnabled });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.bgMusicEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.bgMusicEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Gameplay Rules & Timer Settings */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Pengaturan Gameplay & Timer</span>
        </h3>

        <div className="space-y-4 text-xs">
          {/* Vertical Timer Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Tampilan Timer Vertikal</div>
              <div className="text-slate-500 dark:text-slate-400">Tampilkan batang energi vertikal di samping kartu pertanyaan</div>
            </div>
            <button
              onClick={() => updateUserSettings({ verticalTimer: !settings.verticalTimer })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.verticalTimer ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.verticalTimer ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Next Delay Slider */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Jeda Otomatis Antarsoal</span>
              <span>{settings.autoNextDelay} Detik</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={3.0}
              step={0.2}
              value={settings.autoNextDelay}
              onChange={(e) => updateUserSettings({ autoNextDelay: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500">
              Waktu melihat hasil jawaban sebelum berpindah otomatis ke soal berikutnya.
            </p>
          </div>

          {/* Confirm on Exit */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Konfirmasi Sebelum Keluar</div>
              <div className="text-slate-500 dark:text-slate-400">Cegah progres quiz hilang secara tidak sengaja saat bermain</div>
            </div>
            <button
              onClick={() => updateUserSettings({ confirmExit: !settings.confirmExit })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.confirmExit ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.confirmExit ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Daily Goal Target */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Target Belajar Harian</div>
              <div className="text-slate-500 dark:text-slate-400">Target jumlah soal yang ingin dikerjakan per hari</div>
            </div>
            <input
              type="number"
              min={5}
              max={100}
              value={settings.dailyGoal}
              onChange={(e) => updateUserSettings({ dailyGoal: Number(e.target.value) })}
              className="w-20 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm text-center"
            />
          </div>
        </div>
      </section>

      {/* PWA App Installation & Backup */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>Aplikasi & Cadangan Data</span>
        </h3>

        <div className="space-y-3">
          <PWAInstallButton variant="card" />

          <div className="pt-2 flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cadangkan Seluruh Data (JSON)</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Unduh file cadangan offline berisi semua kategori, soal, riwayat, dan preferensi.
              </p>
            </div>
            <button
              onClick={handleExportFullBackup}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Data</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
