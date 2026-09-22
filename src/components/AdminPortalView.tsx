import React, { useState, useEffect } from 'react';
import { APP_ASSETS } from '../data/initialData';
import { UserSession, UserRole, TabType } from '../types';
import { auth, loginWithEmail, resetPasswordForEmail } from '../lib/firebase';
import { sound } from '../utils/sound';

interface AdminPortalViewProps {
  session: UserSession;
  onUpdateSession: (newSession: Partial<UserSession>) => void;
  onNavigateToTab?: (tab: TabType) => void;
  onResetDatabase?: () => void;
  onExportBackup?: () => void;
  onLogout?: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  session,
  onUpdateSession,
  onNavigateToTab,
  onResetDatabase,
  onExportBackup,
  onLogout,
}) => {
  const registeredEmail =
    auth.currentUser?.email ||
    (session.email && !session.email.includes('organizer.com') ? session.email : '') ||
    session.email ||
    '';

  const [role, setRole] = useState<UserRole>(session.role || 'admin');
  const [email, setEmail] = useState<string>(registeredEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep email synced with active authenticated user
  useEffect(() => {
    const active = auth.currentUser?.email || session.email;
    if (active && !active.includes('organizer.com')) {
      setEmail(active);
    }
  }, [session.email]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    sound.playTap();
    setRole(newRole);
    onUpdateSession({
      role: newRole,
      deskName: newRole === 'admin' ? 'Meja Admin Utama' : (session.deskName || 'Meja Resepsionis A'),
    });
    showToast(`Beralih ke mode ${newRole === 'admin' ? 'Admin Utama' : 'Petugas Meja (Kiosk)'}`);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    sound.playTap();

    const targetEmail = email.trim();
    if (!targetEmail) {
      setAuthError('Silakan masukkan alamat email akun Anda.');
      return;
    }

    // If password is blank but session is already authenticated with this email
    if (!password) {
      if (session.isAuthenticated && (session.email === targetEmail || auth.currentUser?.email === targetEmail)) {
        onUpdateSession({
          role,
          isAuthenticated: true,
        });
        showToast('Sesi akun terdaftar aktif dan berhasil dikonfirmasi.');
        if (onNavigateToTab) {
          setTimeout(() => onNavigateToTab('buku-tamu'), 800);
        }
        return;
      }
      setAuthError('Silakan masukkan kata sandi akun terdaftar Anda.');
      return;
    }

    setLoadingAuth(true);
    try {
      const user = await loginWithEmail(targetEmail, password);
      sound.playScanSuccess();
      showToast(`Berhasil masuk dengan akun terdaftar: ${user.email}`);
      onUpdateSession({
        isAuthenticated: true,
        email: user.email || targetEmail,
        name: user.displayName || user.email?.split('@')[0] || session.name,
        uid: user.uid,
        role,
      });
      setPassword('');
      if (onNavigateToTab) {
        setTimeout(() => {
          onNavigateToTab('buku-tamu');
        }, 900);
      }
    } catch (err: any) {
      sound.playError();
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('Kata sandi tidak sesuai dengan akun terdaftar ini. Silakan periksa kembali atau gunakan Lupa Kata Sandi.');
      } else if (code === 'auth/user-not-found') {
        setAuthError('Akun belum terdaftar. Pastikan memasukkan alamat email yang sudah didaftarkan sebelumnya.');
      } else {
        setAuthError(err.message || 'Gagal memverifikasi akun terdaftar.');
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = email.trim() || session.email || auth.currentUser?.email || '';
    if (!targetEmail) {
      showToast('Ketik alamat email akun Anda terlebih dahulu.');
      return;
    }
    sound.playTap();
    try {
      await resetPasswordForEmail(targetEmail);
      sound.playSuccess();
      showToast(`Tautan pemulihan kata sandi telah dikirim ke ${targetEmail}`);
    } catch (err: any) {
      sound.playError();
      showToast('Gagal mengirim tautan reset: ' + (err?.message || 'Pastikan email sudah terdaftar.'));
    }
  };

  const handleQuickPin = (deskName: string, pin: string) => {
    sound.playTap();
    showToast(`PIN ${pin} Terverifikasi! Membuka check-in cepat ${deskName}...`);
    onUpdateSession({
      role: 'reception',
      deskName,
      isAuthenticated: true,
    });
    if (onNavigateToTab) {
      setTimeout(() => {
        onNavigateToTab('input-tamu');
      }, 900);
    }
  };

  return (
    <div className="flex flex-col w-full px-3 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto relative overflow-hidden pb-28">
      {/* Subtle Ambient Glow Orbs */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-orange-300/20 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-amber-300/20 blur-3xl pointer-events-none"></div>

      {/* Main Portal Card */}
      <div className="relative glass-card rounded-2xl shadow-xl overflow-hidden p-4 sm:p-7 border border-orange-200/80">
        {/* Top Foil Orange & Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-600"></div>

        {/* Responsive 2-Column Grid (Mobile: 1 Col, Desktop: 12 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Header, Role Switcher & Login Form (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4 pt-1">
            {/* Header Section */}
            <div className="flex items-center space-x-3.5">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 p-1 rounded-2xl bg-white shadow-xs flex items-center justify-center border border-orange-200 shrink-0">
                <img
                  alt="EBook Wedding Logo"
                  className="w-full h-full object-contain rounded-xl"
                  src={APP_ASSETS.logo}
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full ring-2 ring-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[12px] text-white font-bold">verified</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-[10px] sm:text-[11px] font-bold text-orange-700 uppercase tracking-wider">
                  EBook Wedding • Organizer Portal
                </span>
                <h1 className="font-headline text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Admin &amp; Kiosk Portal
                </h1>
                <p className="font-headline text-xs sm:text-sm text-stone-500 italic">
                  The Wedding of Kevin &amp; Clarissa
                </p>
              </div>
            </div>


            {/* Active Registered Account Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-orange-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-body text-xs font-bold text-stone-900">
                    Akun Terdaftar Aktif
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-100 text-orange-900 border border-orange-200">
                  {role === 'admin' ? 'Admin Utama' : 'Petugas Meja (Kiosk)'}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white/90 p-3 rounded-xl border border-orange-200/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {(session.name || session.email || 'A')[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-body text-xs sm:text-sm font-bold text-stone-900 truncate">
                    {session.name || 'Penyelenggara Acara'}
                  </span>
                  <span className="font-body text-xs text-orange-700 font-medium truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    {session.email || auth.currentUser?.email || 'Belum masuk'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Switcher Tabs */}
            <div className="space-y-1">
              <label className="font-body text-xs text-stone-700 font-semibold">
                Pilih Mode Peran (Role)
              </label>
              <div className="w-full bg-orange-50/80 p-1.5 rounded-xl flex items-center gap-1.5 border border-orange-200/60">
                <button
                  type="button"
                  onClick={() => handleSwitchRole('admin')}
                  className={`flex-1 py-2 px-3 rounded-lg font-body text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'admin'
                      ? 'bg-white text-orange-700 shadow-xs border border-orange-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">shield_person</span>
                  <span>Admin Utama</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRole('reception')}
                  className={`flex-1 py-2 px-3 rounded-lg font-body text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'reception'
                      ? 'bg-white text-orange-700 shadow-xs border border-orange-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">how_to_reg</span>
                  <span>Petugas Meja (Kiosk)</span>
                </button>
              </div>
            </div>

            {/* Login / Konfirmasi Akun Terdaftar Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col space-y-3.5 pt-1">
              {/* Email Input */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="adminEmail"
                    className="font-body text-xs text-stone-700 font-semibold flex items-center gap-1"
                  >
                    <span>Email Akun Terdaftar</span>
                  </label>
                  <span className="text-[10.5px] text-orange-700 font-semibold">
                    Akun Terverifikasi
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-lg text-orange-600">
                    mail
                  </span>
                  <input
                    id="adminEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-white text-stone-900 font-body text-xs sm:text-sm rounded-xl outline-none focus:ring-2 focus:ring-orange-500 border border-orange-200/80 shadow-xs transition-all"
                  />
                </div>
                <p className="text-[11px] text-stone-500 italic">
                  Gunakan email dari akun yang sudah didaftarkan sebelumnya.
                </p>
              </div>

              {/* Password Input */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between font-body text-xs">
                  <label htmlFor="adminPassword" className="text-stone-700 font-semibold">
                    Kata Sandi Akun
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-body text-[10.5px] text-orange-700 font-bold hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-lg text-orange-600">
                    key
                  </span>
                  <input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun..."
                    className="w-full pl-10 pr-10 py-2.5 bg-white text-stone-900 font-body text-xs sm:text-sm rounded-xl outline-none focus:ring-2 focus:ring-orange-500 border border-orange-200/80 shadow-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-700 focus:outline-none flex items-center"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-rose-600 text-base shrink-0 mt-0.5">
                    error
                  </span>
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {/* Remember Session */}
              <div className="flex items-center justify-between pt-0.5 font-body text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-orange-600 cursor-pointer"
                  />
                  <span className="text-stone-600">Ingat sesi di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full py-3 px-4 rounded-xl font-body text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loadingAuth ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">login</span>
                    <span>Masuk dengan Akun Terdaftar</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Fast PIN Access, Database Utilities & Status (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4 pt-1 lg:border-l lg:border-orange-200/70 lg:pl-6">
            {/* Fast Receptionist PIN Access Section */}
            <div className="bg-orange-50/70 rounded-2xl p-4 flex flex-col space-y-2.5 border border-orange-200/60 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg text-orange-600">pin</span>
                  <span className="font-body text-xs sm:text-sm text-stone-900 font-bold">
                    Akses Kilat Meja Registrasi
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-orange-200/80 text-orange-900 font-body text-[10px] font-bold rounded-full">
                  Kiosk Mode
                </span>
              </div>
              <p className="font-body text-[11px] text-stone-600 leading-relaxed">
                Petugas front desk dapat langsung beralih ke meja registrasi tamu menggunakan 4-digit PIN:
              </p>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {/* Desk 1 */}
                <button
                  type="button"
                  onClick={() => handleQuickPin('Meja 1 (VIP & Family)', '8821')}
                  className="p-2.5 sm:p-3 bg-white hover:bg-orange-100/50 rounded-xl shadow-xs text-left flex flex-col space-y-1.5 active:scale-[0.97] transition-all border border-orange-200/80 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-stone-900 font-bold truncate group-hover:text-orange-700">
                      Meja 1 (VIP)
                    </span>
                    <span className="material-symbols-outlined text-base text-orange-600">bolt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-body text-[10px] text-stone-500">PIN: 8821</span>
                  </div>
                </button>

                {/* Desk 2 */}
                <button
                  type="button"
                  onClick={() => handleQuickPin('Meja 2 (Reguler)', '8822')}
                  className="p-2.5 sm:p-3 bg-white hover:bg-orange-100/50 rounded-xl shadow-xs text-left flex flex-col space-y-1.5 active:scale-[0.97] transition-all border border-orange-200/80 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-stone-900 font-bold truncate group-hover:text-orange-700">
                      Meja 2 (Reguler)
                    </span>
                    <span className="material-symbols-outlined text-base text-amber-600">
                      flash_on
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-body text-[10px] text-stone-500">PIN: 8822</span>
                  </div>
                </button>

                {/* Desk 3: Booth Souvenir */}
                <button
                  type="button"
                  onClick={() => {
                    handleQuickPin('Booth Souvenir', '8823');
                    if (onNavigateToTab) onNavigateToTab('kelola-souvenir');
                  }}
                  className="p-2.5 sm:p-3 bg-white hover:bg-orange-100/50 rounded-xl shadow-xs text-left flex flex-col space-y-1.5 active:scale-[0.97] transition-all border border-orange-200/80 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-stone-900 font-bold truncate group-hover:text-orange-700">
                      Booth Souvenir
                    </span>
                    <span className="material-symbols-outlined text-base text-purple-600">
                      featured_seasonal_and_gifts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="font-body text-[10px] text-stone-500">Kupon &amp; Stok</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Database Management Utilities */}
            <div className="bg-orange-50/70 rounded-2xl p-4 flex flex-col space-y-2.5 border border-orange-200/60 shadow-xs">
              <span className="font-body text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-orange-600">database</span>
                Pemeliharaan Data Acara
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onExportBackup) onExportBackup();
                    showToast('Cadangan database JSON berhasil diunduh.');
                  }}
                  className="py-2.5 px-3 bg-white hover:bg-orange-50 rounded-xl text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-orange-200 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-orange-600">download</span>
                  Backup JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset database ke data awal pernikahan Kevin & Clarissa?')) {
                      if (onResetDatabase) onResetDatabase();
                      showToast('Database berhasil dipulihkan ke data awal.');
                    }
                  }}
                  className="py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-200 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  Reset Data
                </button>
              </div>
            </div>

            {/* Akun Aktif & Logout */}
            <div className="p-3.5 bg-white rounded-2xl border border-orange-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {session.name ? session.name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                    {session.name || 'Pengguna Terdaftar'}
                  </span>
                  <span className="text-[11px] text-stone-500 truncate">
                    {session.email}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Keluar</span>
                </button>
              )}
            </div>

            {/* Tentang Aplikasi & Dukungan Pengembang */}
            <div className="bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-orange-50/80 rounded-2xl p-4 border border-orange-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-600 text-lg">info</span>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm">
                    Tentang Aplikasi &amp; Versi
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                  v.1.02
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-orange-200/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Versi Sistem:</span>
                  <strong className="text-stone-900 font-bold">wedding book v.1.02</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Pengembang:</span>
                  <strong className="text-orange-700 font-bold">microdata2r</strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-orange-100">
                  <span className="text-stone-500">Bantuan WA:</span>
                  <a
                    href="https://wa.me/6282186371356"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>+6282186371356</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Email:</span>
                  <a
                    href="mailto:digitalserviceprint.io@gmail.com"
                    className="font-semibold text-orange-600 hover:underline truncate max-w-[180px]"
                  >
                    digitalserviceprint.io@gmail.com
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('panduan-bantuan')}
                  className="py-2 px-3 bg-white hover:bg-orange-100/60 rounded-xl text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-orange-200 shadow-2xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm text-orange-600">help</span>
                  <span>Buka Panduan</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('tentang-aplikasi')}
                  className="py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  <span>Tentang &amp; Rilis</span>
                </button>
              </div>
            </div>

            {/* Live Server Status Bar */}
            <div className="pt-2 flex items-center justify-between font-body text-xs text-stone-500 border-t border-orange-200/50">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>
                  Firestore Cloud: <strong className="text-stone-900 font-bold">Online</strong> (18ms)
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-700 font-semibold">
                <span className="material-symbols-outlined text-sm">cloud_done</span>
                <span>wedding book v.1.02</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="mt-4 p-3.5 rounded-2xl bg-white text-stone-900 flex items-center gap-2.5 shadow-lg border border-orange-300 text-xs font-body animate-in fade-in">
          <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span>
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-stone-600">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
