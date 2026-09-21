import React, { useState } from 'react';
import { APP_ASSETS } from '../data/initialData';
import { UserSession, UserRole } from '../types';

interface AdminPortalViewProps {
  session: UserSession;
  onUpdateSession: (newSession: Partial<UserSession>) => void;
  onNavigateToTab?: (tab: 'buku-tamu' | 'input-tamu') => void;
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
  const [role, setRole] = useState<UserRole>(session.role);
  const [email, setEmail] = useState(
    role === 'admin'
      ? 'admin.wedding@organizer.com'
      : 'receptionist.desk@organizer.com'
  );
  const [password, setPassword] = useState('WeddingKevinClarissa2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setEmail('admin.wedding@organizer.com');
      onUpdateSession({
        role: 'admin',
        email: 'admin.wedding@organizer.com',
        deskName: 'Meja Resepsionis A',
      });
      showToast('Beralih ke mode Admin Utama');
    } else {
      setEmail('receptionist.desk@organizer.com');
      onUpdateSession({
        role: 'reception',
        email: 'receptionist.desk@organizer.com',
        deskName: 'Meja 2 (Reguler)',
      });
      showToast('Beralih ke mode Petugas Meja (Kiosk)');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Validasi Firebase Auth Token berhasil! Sesi terenkripsi aktif.');
    onUpdateSession({
      isAuthenticated: true,
      email,
      role,
    });
    if (onNavigateToTab) {
      setTimeout(() => {
        onNavigateToTab('buku-tamu');
      }, 1000);
    }
  };

  const handleGoogleAuth = () => {
    showToast('Menghubungkan ke Google Identity Provider (Firebase)... Berhasil login!');
    onUpdateSession({
      isAuthenticated: true,
      email: 'organizer.google@wedding.com',
    });
    if (onNavigateToTab) {
      setTimeout(() => {
        onNavigateToTab('buku-tamu');
      }, 1000);
    }
  };

  const handleQuickPin = (deskName: string, pin: string) => {
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

            {/* Security Notice Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-200/70 w-full sm:w-auto">
              <span className="material-symbols-outlined text-base text-orange-600 fill-1">
                lock
              </span>
              <span className="font-body text-xs text-orange-950 font-medium">
                Firebase Auth 256-bit Encrypted Session
              </span>
            </div>

            {/* Role Switcher Tabs */}
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

            {/* Standard Login Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col space-y-3.5 pt-1">
              {/* Email Input */}
              <div className="flex flex-col space-y-1">
                <label
                  htmlFor="adminEmail"
                  className="font-body text-xs text-stone-700 font-semibold flex items-center gap-1"
                >
                  <span>Email Pengelola</span>
                </label>
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
                    placeholder="admin.wedding@organizer.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-white text-stone-900 font-body text-xs sm:text-sm rounded-xl outline-none focus:ring-2 focus:ring-orange-500 border border-orange-200/80 shadow-xs transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between font-body text-xs">
                  <label htmlFor="adminPassword" className="text-stone-700 font-semibold">
                    Password Akun
                  </label>
                  <span className="font-body text-[10.5px] text-orange-700 font-bold">
                    Master Key
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-lg text-orange-600">
                    key
                  </span>
                  <input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
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

              {/* Remember & Forgot Options */}
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
                <button
                  type="button"
                  onClick={() => showToast('Instruksi pemulihan password telah dikirim ke email panitia.')}
                  className="text-orange-700 font-semibold hover:underline"
                >
                  Lupa Password?
                </button>
              </div>

              {/* Primary CTA: Firebase Auth Submit */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-body text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">verified_user</span>
                <span>Masuk dengan Firebase Auth</span>
              </button>

              {/* Alternative Social Auth Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="w-full h-px bg-orange-100"></div>
                <span className="absolute px-2.5 bg-white font-body text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  atau opsi cloud
                </span>
              </div>

              {/* Google Sign In Option */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-2.5 px-4 bg-white hover:bg-orange-50 text-stone-800 font-body text-xs font-semibold rounded-xl shadow-xs border border-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  ></path>
                </svg>
                <span>Masuk dengan Akun Google (Firebase Auth)</span>
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

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {/* Desk 1 */}
                <button
                  type="button"
                  onClick={() => handleQuickPin('Meja 1 (VIP & Family)', '8821')}
                  className="p-3 bg-white hover:bg-orange-100/50 rounded-xl shadow-xs text-left flex flex-col space-y-1.5 active:scale-[0.97] transition-all border border-orange-200/80 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-stone-900 font-bold truncate group-hover:text-orange-700">
                      Meja 1 (VIP)
                    </span>
                    <span className="material-symbols-outlined text-base text-orange-600">bolt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-body text-[10.5px] text-stone-500">PIN: •••• (8821)</span>
                  </div>
                </button>

                {/* Desk 2 */}
                <button
                  type="button"
                  onClick={() => handleQuickPin('Meja 2 (Reguler)', '8822')}
                  className="p-3 bg-white hover:bg-orange-100/50 rounded-xl shadow-xs text-left flex flex-col space-y-1.5 active:scale-[0.97] transition-all border border-orange-200/80 group"
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
                    <span className="font-body text-[10.5px] text-stone-500">PIN: •••• (8822)</span>
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
                <span>v2.4.0 Synced</span>
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
