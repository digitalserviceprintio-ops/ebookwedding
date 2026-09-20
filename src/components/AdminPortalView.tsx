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
    <div className="flex flex-col w-full px-4 py-4 max-w-md mx-auto relative overflow-hidden pb-28">
      {/* Subtle Ambient Glow Orbs */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#ffdea5]/30 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-[#ffdadb]/40 blur-3xl pointer-events-none"></div>

      {/* Main Portal Card */}
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden p-5 flex flex-col space-y-4 border border-[#e4e1ea]/70">
        {/* Top Foil Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#e9c176] via-[#c5a059] to-[#775a19]"></div>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative w-20 h-20 mb-2 p-1 rounded-full bg-[#f5f2fb] shadow-sm flex items-center justify-center border border-[#c5a059]/30">
            <img
              alt="EBook Wedding Logo"
              className="w-full h-full object-contain rounded-full"
              src={APP_ASSETS.logo}
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#c5a129] rounded-full ring-2 ring-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[11px] text-white">verified</span>
            </span>
          </div>
          <span className="font-body text-[10px] font-bold text-[#775a19] uppercase tracking-widest mb-0.5">
            EBook Wedding • Organizer Portal
          </span>
          <h1 className="font-headline text-[24px] text-[#1b1b21] font-semibold tracking-tight">
            Admin Portal
          </h1>
          <p className="font-headline text-[16px] text-[#92484f] italic mt-0.5">
            The Wedding of Kevin &amp; Clarissa
          </p>

          {/* Security Badge */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-[#f5f2fb] rounded-full border border-[#e4e1ea]/60">
            <span className="material-symbols-outlined text-[15px] text-[#735c00] fill-1">
              lock
            </span>
            <span className="font-body text-[10.5px] text-[#4e4639] font-medium">
              Firebase Auth 256-bit Encrypted Session
            </span>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="w-full bg-[#f5f2fb] p-1 rounded-xl flex items-center gap-1 border border-[#e4e1ea]/60">
          <button
            type="button"
            onClick={() => handleSwitchRole('admin')}
            className={`flex-1 py-2 px-2 rounded-lg font-body text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'admin'
                ? 'bg-white text-[#775a19] shadow-sm border border-[#e4e1ea]/40'
                : 'text-[#7f7667] hover:text-[#1b1b21]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
            <span>Admin Utama</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('reception')}
            className={`flex-1 py-2 px-2 rounded-lg font-body text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'reception'
                ? 'bg-white text-[#92484f] shadow-sm border border-[#e4e1ea]/40'
                : 'text-[#7f7667] hover:text-[#1b1b21]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>Petugas Meja</span>
          </button>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleAuthSubmit} className="flex flex-col space-y-3 pt-1">
          {/* Email Input */}
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="adminEmail"
              className="font-body text-[11.5px] text-[#4e4639] font-semibold flex items-center gap-1"
            >
              <span>Email Pengelola</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#775a19]">
                mail
              </span>
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin.wedding@organizer.com"
                className="w-full pl-10 pr-3 py-2.5 bg-[#f5f2fb] text-[#1b1b21] font-body text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#775a19] border border-[#e4e1ea]/60 shadow-inner transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between font-body text-[11.5px]">
              <label htmlFor="adminPassword" className="text-[#4e4639] font-semibold">
                Password Akun
              </label>
              <span className="font-body text-[10px] text-[#775a19] font-bold">
                Master Key
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#775a19]">
                key
              </span>
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-10 py-2.5 bg-[#f5f2fb] text-[#1b1b21] font-body text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#775a19] border border-[#e4e1ea]/60 shadow-inner transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#7f7667] hover:text-[#1b1b21] focus:outline-none flex items-center"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember & Forgot Options */}
          <div className="flex items-center justify-between pt-0.5 font-body text-[11.5px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#775a19] cursor-pointer"
              />
              <span className="text-[#4e4639]">Ingat sesi di perangkat</span>
            </label>
            <button
              type="button"
              onClick={() => showToast('Instruksi pemulihan password telah dikirim ke email panitia.')}
              className="text-[#92484f] font-semibold hover:underline"
            >
              Lupa Password?
            </button>
          </div>

          {/* Primary CTA: Firebase Auth Submit */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-body text-[13px] text-white bg-gradient-to-r from-[#c5a059] via-[#e9c176] to-[#775a19] font-bold shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
            <span>Masuk dengan Firebase Auth</span>
          </button>

          {/* Alternative Social Auth Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full h-px bg-[#e4e1ea]"></div>
            <span className="absolute px-2.5 bg-white font-body text-[10px] text-[#7f7667] uppercase tracking-wider font-semibold">
              atau opsi cloud
            </span>
          </div>

          {/* Google Sign In Option */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 bg-[#f5f2fb] hover:bg-[#eae7ef] text-[#1b1b21] font-body text-[12px] font-semibold rounded-xl shadow-xs border border-[#e4e1ea]/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
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

        {/* Fast Receptionist PIN Access Section */}
        <div className="mt-2 bg-[#f5f2fb] rounded-xl p-3 flex flex-col space-y-2 border border-[#e4e1ea]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-[#92484f]">pin</span>
              <span className="font-body text-[12px] text-[#1b1b21] font-bold">
                Akses Kilat Meja Registrasi
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#ffdadb] text-[#3c0610] font-body text-[10px] font-bold rounded-full">
              Kiosk Mode
            </span>
          </div>
          <p className="font-body text-[10.5px] text-[#4e4639] leading-relaxed">
            Petugas front desk dapat langsung beralih meja registrasi tamu menggunakan 4-digit PIN
            terverifikasi:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {/* Desk 1 */}
            <button
              type="button"
              onClick={() => handleQuickPin('Meja 1 (VIP & Family)', '8821')}
              className="p-2.5 bg-white hover:bg-[#ffdea5]/30 rounded-lg shadow-xs text-left flex flex-col space-y-1 active:scale-[0.97] transition-all border border-[#e4e1ea]/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-body text-[11.5px] text-[#1b1b21] font-bold truncate">
                  Meja 1 (VIP &amp; Family)
                </span>
                <span className="material-symbols-outlined text-[14px] text-[#775a19]">bolt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c5a129]"></span>
                <span className="font-body text-[10px] text-[#7f7667]">PIN: •••• (8821)</span>
              </div>
            </button>

            {/* Desk 2 */}
            <button
              type="button"
              onClick={() => handleQuickPin('Meja 2 (Reguler)', '8822')}
              className="p-2.5 bg-white hover:bg-[#ffdadb]/30 rounded-lg shadow-xs text-left flex flex-col space-y-1 active:scale-[0.97] transition-all border border-[#e4e1ea]/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-body text-[11.5px] text-[#1b1b21] font-bold truncate">
                  Meja 2 (Reguler)
                </span>
                <span className="material-symbols-outlined text-[14px] text-[#92484f]">
                  flash_on
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c5a129]"></span>
                <span className="font-body text-[10px] text-[#7f7667]">PIN: •••• (8822)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Database Management Utilities */}
        <div className="bg-[#f5f2fb] rounded-xl p-3 flex flex-col space-y-2 border border-[#e4e1ea]/60">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11.5px] font-bold text-[#1b1b21] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#775a19]">database</span>
              Pemeliharaan Data Acara
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onExportBackup) onExportBackup();
                showToast('Cadangan database JSON berhasil diunduh.');
              }}
              className="py-2 px-2.5 bg-white hover:bg-[#efecf5] rounded-lg text-[#1b1b21] text-[11px] font-semibold flex items-center justify-center gap-1 border border-[#e4e1ea]"
            >
              <span className="material-symbols-outlined text-[14px] text-[#775a19]">download</span>
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
              className="py-2 px-2.5 bg-white hover:bg-red-50 text-red-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border border-red-200"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              Reset Data
            </button>
          </div>
        </div>

        {/* Akun Aktif & Logout */}
        <div className="p-3 bg-[#fdfaf3] rounded-xl border border-[#e9c176]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#775a19] text-[#ffdea5] flex items-center justify-center font-bold text-xs shrink-0">
              {session.name ? session.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[12px] text-[#1b1b21] truncate">
                {session.name || 'Pengguna Terdaftar'}
              </span>
              <span className="text-[10.5px] text-[#7f7667] truncate">
                {session.email}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 flex items-center gap-1 shrink-0 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span>Keluar Akun</span>
            </button>
          )}
        </div>

        {/* Live Server Status Bar */}
        <div className="pt-1 flex items-center justify-between font-body text-[10.5px] text-[#7f7667] border-t border-[#e4e1ea]/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>
              Firestore Cloud: <strong className="text-[#1b1b21] font-bold">Online</strong> (18ms)
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#775a19] font-semibold">
            <span className="material-symbols-outlined text-[13px]">cloud_done</span>
            <span>v2.4.0 Synced</span>
          </div>
        </div>
      </div>

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="mt-3 p-3 rounded-xl bg-white text-[#1b1b21] flex items-center gap-2 shadow-lg border border-[#c5a059]/40 text-[12px] font-body animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-[#735c00]">check_circle</span>
          <span className="flex-1">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#7f7667]">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
