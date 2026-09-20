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
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8ff] via-[#f5f0fb] to-[#ece6f5] text-[#1b1b21] flex flex-col justify-center items-center p-4 selection:bg-[#ffdea5] selection:text-[#261900]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e4e1ea] overflow-hidden my-4">
        
        {/* Header Elegance */}
        <div className="bg-gradient-to-br from-[#261900] via-[#473600] to-[#775a19] text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#ffdea5]/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 border border-[#ffdea5]/40 mb-3 shadow-inner">
            <span className="font-headline text-lg font-bold text-[#ffdea5]">K &amp; C</span>
          </div>

          <h1 className="font-headline text-[22px] font-bold text-[#ffdea5] tracking-tight">
            EBook Wedding Digital
          </h1>
          <p className="font-body text-[12.5px] text-white/80 mt-1 max-w-xs mx-auto">
            Buku Tamu &amp; Meja Resepsionis Digital dengan Penyimpanan Cloud Permanen
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/15 text-[11px] text-[#ffe088]">
            <span className="material-symbols-outlined text-sm">cloud_done</span>
            <span>Data Terisolasi Per-Akun di Firestore</span>
          </div>
        </div>

        {/* Tab Switcher: Daftar vs Masuk */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] text-[12.5px] font-semibold">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                isRegisterMode
                  ? 'bg-[#775a19] text-white shadow-sm font-bold'
                  : 'text-[#4e4639] hover:bg-white/60'
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
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                !isRegisterMode
                  ? 'bg-[#775a19] text-white shadow-sm font-bold'
                  : 'text-[#4e4639] hover:bg-white/60'
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[12px] flex items-start gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-rose-600 text-base shrink-0 mt-0.5">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 font-body text-[13px]">
            
            {/* Nama Pengguna / Penyelenggara (Register only) */}
            {isRegisterMode && (
              <>
                <div className="space-y-1">
                  <label className="block font-semibold text-[#1b1b21] text-[12px]">
                    Nama Lengkap Penyelenggara / WO <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7f7667] text-[18px]">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Contoh: Kevin Pratama"
                      className="w-full pl-9 pr-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[13px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block font-semibold text-[#1b1b21] text-[11.5px]">
                      Judul Acara Wedding
                    </label>
                    <input
                      type="text"
                      value={weddingTitle}
                      onChange={(e) => setWeddingTitle(e.target.value)}
                      placeholder="Kevin & Clarissa"
                      className="w-full px-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[12px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-[#1b1b21] text-[11.5px]">
                      Tanggal Acara
                    </label>
                    <input
                      type="text"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      placeholder="20 September 2026"
                      className="w-full px-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[12px]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="block font-semibold text-[#1b1b21] text-[12px]">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7f7667] text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[13px]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block font-semibold text-[#1b1b21] text-[12px]">
                Kata Sandi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7f7667] text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-10 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#7f7667] hover:text-[#1b1b21]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="block font-semibold text-[#1b1b21] text-[12px]">
                  Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7f7667] text-[18px]">
                    lock_reset
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-9 pr-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[13px]"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#775a19] to-[#634b15] hover:from-[#634b15] hover:to-[#503b0f] text-white font-bold text-[13.5px] shadow-md flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  <span>Memproses Akun...</span>
                </>
              ) : isRegisterMode ? (
                <>
                  <span className="material-symbols-outlined text-[19px]">how_to_reg</span>
                  <span>Daftar Akun &amp; Buka Dashboard</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[19px]">login</span>
                  <span>Masuk ke Dashboard Saya</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#e4e1ea]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-[#7f7667] font-semibold">
              atau opsi cepat
            </span>
            <div className="flex-grow border-t border-[#e4e1ea]"></div>
          </div>

          {/* Demo Account Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-[#f5f2fb] hover:bg-[#ece6f5] border border-[#e4e1ea] text-[#775a19] font-bold text-[12.5px] flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Masuk Cepat dengan Akun Demo (1-Klik)</span>
          </button>

          {/* Guest RSVP Link */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onOpenRSVP}
              className="text-[12px] text-[#775a19] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Hanya ingin mengisi RSVP Tamu? Buka Formulir RSVP</span>
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#fdfaf3] border-t border-[#e9c176]/30 text-center text-[11px] text-[#7f7667]">
          Data tamu, foto, dan amplop tersimpan aman &amp; permanen di Firebase Cloud Firestore.
        </div>

      </div>
    </div>
  );
};
