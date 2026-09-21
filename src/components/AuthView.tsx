import React, { useState } from 'react';
import { 
  registerWithEmail, 
  loginWithEmail, 
  loginDemoAccount 
} from '../lib/firebase';
import { sound } from '../utils/sound';
import { APP_ASSETS } from '../data/initialData';

interface AuthViewProps {
  onOpenRSVP: () => void;
  onLoginSuccess: (user: { uid: string; email: string; displayName?: string }) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onOpenRSVP,
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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email ini sudah terdaftar. Silakan beralih ke menu Masuk.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('Email atau kata sandi tidak sesuai.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Format email tidak valid.');
      } else {
        setErrorMsg(err.message || 'Terjadi kendala saat autentikasi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    sound.playTap();
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginDemoAccount('Demo Pengantin (Kevin & Clarissa)');
      sound.playScanSuccess();
      onLoginSuccess({
        uid: user.uid,
        email: user.email || 'demo@wedding.app',
        displayName: 'Demo Pengantin',
      });
    } catch (err: any) {
      console.error('Demo auth error:', err);
      setErrorMsg('Gagal masuk akun demo: ' + (err.message || 'Silakan coba daftar manual.'));
    } finally {
      setLoading(false);
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
          <p className="font-body text-xs sm:text-sm text-orange-200/80 mt-1.5 max-w-sm mx-auto">
            Buku Tamu &amp; Meja Resepsionis Digital dengan Penyimpanan Cloud Permanen
          </p>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/40 border border-orange-400/30 text-xs text-orange-200">
            <span className="material-symbols-outlined text-sm text-orange-400">cloud_done</span>
            <span>Data Terisolasi Per-Akun di Firestore</span>
          </div>
        </div>

        {/* Tab Switcher: Daftar vs Masuk */}
        <div className="p-4 sm:p-6 pb-0">
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
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">
                error
              </span>
              <span>{errorMsg}</span>
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
              <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
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

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-orange-200/60"></div>
            <span className="flex-shrink mx-3 text-xs text-stone-500 font-semibold">
              atau opsi cepat
            </span>
            <div className="flex-grow border-t border-orange-200/60"></div>
          </div>

          {/* Demo Account Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-3 px-3 rounded-xl bg-orange-50/70 hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <span className="material-symbols-outlined text-lg text-orange-600">bolt</span>
            <span>Masuk Cepat dengan Akun Demo (1-Klik)</span>
          </button>

          {/* Guest RSVP Link */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onOpenRSVP}
              className="text-xs sm:text-sm text-orange-700 hover:text-orange-900 hover:underline font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              <span>Hanya ingin mengisi RSVP Tamu? Buka Formulir RSVP</span>
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-orange-50/50 border-t border-orange-200/60 text-center text-xs text-stone-500">
          Data tamu, foto, dan amplop tersimpan aman &amp; permanen di Firebase Cloud Firestore.
        </div>

      </div>
    </div>
  );
};
