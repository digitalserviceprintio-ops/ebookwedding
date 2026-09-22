import React, { useState } from 'react';
import { 
  registerWithEmail, 
  loginWithEmail,
  resetPasswordForEmail
} from '../lib/firebase';
import { sound } from '../utils/sound';
import { APP_ASSETS } from '../data/initialData';

interface AuthViewProps {
  onOpenRSVP?: () => void;
  onLoginSuccess: (user: { uid: string; email: string; displayName?: string }) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [weddingTitle, setWeddingTitle] = useState('The Wedding of Kevin & Clarissa');
  const [weddingDate, setWeddingDate] = useState('20 September 2026');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmailAlreadyRegistered, setIsEmailAlreadyRegistered] = useState(false);
  const [isInvalidCredential, setIsInvalidCredential] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsEmailAlreadyRegistered(false);
    setIsInvalidCredential(false);
    setResetSuccessMsg(null);
    sound.playTap();

    if (isRegisterMode && password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        const user = await registerWithEmail(
          email.trim(),
          password,
          displayName.trim() || 'Pengguna Wedding',
          weddingTitle.trim(),
          weddingDate.trim()
        );
        sound.playScanSuccess();
        onLoginSuccess({
          uid: user.uid,
          email: user.email || email,
          displayName: displayName.trim() || user.email?.split('@')[0],
        });
      } else {
        const user = await loginWithEmail(email.trim(), password);
        sound.playScanSuccess();
        onLoginSuccess({
          uid: user.uid,
          email: user.email || email,
          displayName: user.displayName || user.email?.split('@')[0],
        });
      }
    } catch (err: any) {
      sound.playError();
      const code = err?.code || '';
      const message = String(err?.message || '');

      const isExpected = [
        'auth/invalid-credential',
        'auth/wrong-password',
        'auth/user-not-found',
        'auth/email-already-in-use',
        'auth/invalid-email',
        'auth/weak-password',
      ].includes(code) || message.includes('invalid-credential') || message.includes('email-already-in-use');

      if (!isExpected) {
        console.error('Auth error:', err);
      } else {
        console.warn('Authentication status:', code || message);
      }

      if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        setIsEmailAlreadyRegistered(true);
        setErrorMsg('Email ini sudah terdaftar sebagai akun aktif. Silakan beralih ke halaman Masuk Akun.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || message.includes('invalid-credential')) {
        setIsInvalidCredential(true);
        setErrorMsg('Email atau kata sandi tidak sesuai. Periksa kembali atau kirim tautan reset kata sandi.');
      } else if (code === 'auth/user-not-found') {
        setErrorMsg('Akun belum terdaftar. Silakan buat akun baru di tab "Daftar Akun Baru".');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Format email tidak valid. Masukkan alamat email yang benar.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Kata sandi terlalu pendek/lemah. Gunakan minimal 6 karakter.');
      } else {
        setErrorMsg(err.message || 'Terjadi kendala saat autentikasi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Ketik alamat email Anda di kolom di bawah terlebih dahulu.');
      return;
    }
    sound.playTap();
    setResetLoading(true);
    setErrorMsg(null);
    setResetSuccessMsg(null);
    try {
      await resetPasswordForEmail(email.trim());
      sound.playSuccess();
      setResetSuccessMsg(`Tautan pemulihan kata sandi telah dikirim ke ${email.trim()}. Silakan cek kotak masuk/spam email Anda.`);
    } catch (err: any) {
      console.error('Reset password error:', err);
      sound.playError();
      setErrorMsg('Gagal mengirim email pemulihan: ' + (err.message || 'Pastikan email sudah terdaftar.'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-amber-50/30 to-orange-100/40 text-stone-900 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-lg md:max-w-xl glass-card bg-white/95 rounded-3xl shadow-2xl border border-orange-200 overflow-hidden my-4">
        
        {/* Header Elegance */}
        <div className="bg-gradient-to-br from-stone-900 via-orange-950 to-stone-900 text-white p-6 sm:p-7 text-center relative overflow-hidden border-b border-orange-500/20">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/20 border border-orange-400/50 mb-3 shadow-inner">
            <span className="font-headline text-lg font-bold text-orange-300">K &amp; C</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-orange-100 tracking-tight">
            EBook Wedding Digital
          </h1>
        </div>

        {/* Tab Switcher: Daftar vs Masuk */}
        <div className="p-4 sm:p-6 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 p-1.5 bg-orange-50/60 rounded-2xl border border-orange-200 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Daftar Akun Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setIsRegisterMode(false);
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                !isRegisterMode
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Masuk Akun</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Email Already Registered Notification with 1-Click Switch */}
          {isEmailAlreadyRegistered && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-stone-800 text-xs sm:text-sm flex flex-col gap-2.5 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">
                  info
                </span>
                <div className="flex-1">
                  <p className="font-bold text-amber-950 text-sm">Alamat Email Sudah Terdaftar</p>
                  <p className="text-stone-600 mt-0.5 leading-relaxed">
                    Email <span className="font-bold text-stone-900">{email}</span> sudah memiliki akun. Silakan langsung masuk dengan kata sandi Anda.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setIsRegisterMode(false);
                    setErrorMsg(null);
                    setIsEmailAlreadyRegistered(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Beralih ke Masuk Akun</span>
                </button>
              </div>
            </div>
          )}

          {/* Invalid Credential Notification with 1-Click Reset or Switch */}
          {isInvalidCredential && (
            <div className="p-4 bg-rose-50 border border-rose-200/90 rounded-2xl text-stone-800 text-xs sm:text-sm flex flex-col gap-2.5 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-rose-600 text-xl shrink-0 mt-0.5">
                  lock_person
                </span>
                <div className="flex-1">
                  <p className="font-bold text-rose-950 text-sm">Email atau Kata Sandi Tidak Sesuai</p>
                  <p className="text-stone-600 mt-0.5 leading-relaxed">
                    Kombinasi email dan kata sandi yang dimasukkan belum tepat. Anda dapat mengirimkan tautan pemulihan kata sandi ke email atau mendaftar jika belum memiliki akun.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">mark_email_read</span>
                  <span>{resetLoading ? 'Mengirim...' : 'Kirim Tautan Reset Kata Sandi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setIsRegisterMode(true);
                    setErrorMsg(null);
                    setIsInvalidCredential(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Daftar Akun Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* General Error Message (if not handled by specific cards) */}
          {errorMsg && !isEmailAlreadyRegistered && !isInvalidCredential && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Password Reset Sent Success Banner */}
          {resetSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">
                check_circle
              </span>
              <span className="leading-snug">{resetSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 font-body text-xs sm:text-sm">
            
            {/* Nama Pengguna / Penyelenggara (Register only) */}
            {isRegisterMode && (
              <>
                <div className="space-y-1">
                  <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                    Nama Lengkap Penyelenggara / WO <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Contoh: Kevin Pratama"
                      className="w-full pl-9 pr-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-stone-900 text-xs">
                      Judul Acara Wedding
                    </label>
                    <input
                      type="text"
                      value={weddingTitle}
                      onChange={(e) => setWeddingTitle(e.target.value)}
                      placeholder="Kevin & Clarissa"
                      className="w-full px-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs text-stone-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-stone-900 text-xs">
                      Tanggal Acara
                    </label>
                    <input
                      type="text"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      placeholder="20 September 2026"
                      className="w-full px-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs text-stone-900"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                Alamat Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[11px] text-orange-700 hover:text-orange-900 font-semibold hover:underline"
                  >
                    {resetLoading ? 'Mengirim...' : 'Lupa kata sandi?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-10 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                  Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                    lock_reset
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-9 pr-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  <span>Memproses Akun...</span>
                </>
              ) : isRegisterMode ? (
                <>
                  <span className="material-symbols-outlined text-lg">how_to_reg</span>
                  <span>Daftar Akun &amp; Buka Dashboard</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Masuk ke Dashboard Saya</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
