import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Guest, Gender, EnvelopeMethod } from '../types';
import { sound } from '../utils/sound';

interface InputTamuViewProps {
  guestCount: number;
  onGuestCreated: (newGuest: Guest) => void;
  onOpenQRScan: () => void;
  onOpenRSVP?: () => void;
  initialPrefill?: Partial<Guest> | null;
}

export const InputTamuView: React.FC<InputTamuViewProps> = ({
  guestCount,
  onGuestCreated,
  onOpenQRScan,
  onOpenRSVP,
  initialPrefill,
}) => {
  const [name, setName] = useState(initialPrefill?.name || '');
  const [gender, setGender] = useState<Gender>(initialPrefill?.gender || 'pria');
  const [paxCount, setPaxCount] = useState<number>(1);
  const [origin, setOrigin] = useState(initialPrefill?.origin || '');
  const [hasEnvelope, setHasEnvelope] = useState(true);
  const [nominal, setNominal] = useState('1.000.000');
  const [envelopeMethod, setEnvelopeMethod] = useState<EnvelopeMethod>('tunai');
  const [hasGift, setHasGift] = useState(false);
  const [giftDesc, setGiftDesc] = useState('');
  const [giftRack, setGiftRack] = useState('K-42');
  const [prayerWish, setPrayerWish] = useState(
    initialPrefill?.prayerWish || ''
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastSavedGuest, setLastSavedGuest] = useState<Guest | null>(null);

  const presetTags = [
    'Jakarta Selatan',
    'Surabaya',
    'Bandung',
    'Keluarga Mempelai Pria',
    'Kolega Kantor',
  ];

  const parseRupiah = (val: string) => {
    return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRupiah(e.target.value);
    setNominal(raw === 0 ? '' : formatRupiah(raw));
  };

  const addQuickNominal = (amount: number) => {
    const current = parseRupiah(nominal);
    setNominal(formatRupiah(current + amount));
  };

  const handleAutoNextRack = () => {
    const match = giftRack.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10) + 1;
      setGiftRack(`K-${num}`);
    } else {
      setGiftRack('K-43');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedNominal = hasEnvelope ? parseRupiah(nominal) : 0;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    // Categorize guest based on origin/relasi
    let category: 'VIP' | 'Keluarga' | 'Reguler' = 'Reguler';
    const lowerOrigin = origin.toLowerCase();
    if (lowerOrigin.includes('vip') || lowerOrigin.includes('menteng') || name.toLowerCase().includes('dr.')) {
      category = 'VIP';
    } else if (lowerOrigin.includes('keluarga') || lowerOrigin.includes('family')) {
      category = 'Keluarga';
    }

    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      gender,
      origin: origin.trim() || 'Jakarta',
      category,
      time: `${hours}:${mins} WIB`,
      timestamp: Date.now(),
      hasEnvelope,
      envelopeNominal: hasEnvelope ? parsedNominal : undefined,
      envelopeMethod: hasEnvelope ? envelopeMethod : undefined,
      hasGift,
      giftDescription: hasGift ? (giftDesc.trim() || 'Bingkisan Pernikahan') : undefined,
      giftShelf: hasGift ? giftRack : undefined,
      prayerWish: prayerWish.trim() || undefined,
      checkedInBy: 'Meja Resepsionis A',
      isVerified: true,
      paxCount: paxCount || 1,
      isRsvp: false,
    };

    onGuestCreated(newGuest);
    setLastSavedGuest(newGuest);

    // Confetti effect!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#c5a059', '#775a19', '#92484f', '#ffdea5'],
    });

    // Play pleasant celebration chime sound
    sound.playCheckInChime();

    // Haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 30, 60]);
    }

    // Show toast
    setShowSuccessToast(true);

    // Reset fields for the next guest
    setName('');
    setPaxCount(1);
    setOrigin('');
    setPrayerWish('');
    setHasGift(false);
    setGiftDesc('');
    setNominal('1.000.000');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 pb-28 md:pb-16 space-y-4">
      {/* Desk status banner */}
      <div className="p-3 sm:p-4 rounded-2xl glass-panel shadow-xs border border-white/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 shrink-0 border border-orange-200">
              <span className="material-symbols-outlined text-xl">desk</span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[10px] sm:text-[11px] text-orange-800 uppercase tracking-wider font-bold">
                Meja Resepsionis A • Cloud Sync
              </span>
              <span className="font-body text-[14px] sm:text-[16px] text-stone-900 font-bold truncate">
                Penerimaan &amp; Registrasi Tamu Undangan
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 shadow-2xs shrink-0 border border-orange-200/60">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-body text-[11px] text-stone-600">Tercatat:</span>
              <span className="font-body text-[12px] text-orange-700 font-extrabold">
                {guestCount} Tamu
              </span>
            </div>

            {onOpenQRScan && (
              <button
                type="button"
                onClick={onOpenQRScan}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full btn-citrus-primary text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                <span>Buka QR Meja</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast Modal */}
      {showSuccessToast && lastSavedGuest && (
        <div className="fixed inset-x-4 top-24 z-50 transition-all duration-300 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
          <div className="p-4 rounded-2xl bg-white shadow-2xl flex items-center gap-3 border-l-4 border-orange-500 ring-1 ring-black/5">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 shrink-0 border border-orange-200">
              <span className="material-symbols-outlined text-2xl fill-1">cloud_done</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-body text-[13.5px] font-bold text-stone-900">
                Data Tamu Berhasil Disimpan!
              </span>
              <span className="font-body text-[11.5px] text-stone-600 truncate">
                {lastSavedGuest.name} tersimpan ke Cloud Firestore &amp; Kupon souvenir siap.
              </span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* QR Tamu & RSVP Quick Buttons for Mobile */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onOpenQRScan}
          className="flex-1 flex items-center justify-between p-3.5 rounded-2xl btn-citrus-primary text-white shadow-md active:scale-[0.98] transition-transform border border-white/40"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl text-white">
                qr_code_2
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-body text-[13.5px] font-bold text-white">
                  QR Meja Tamu &amp; RSVP Digital
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-white/90 text-orange-700 shadow-2xs">
                  Scan HP
                </span>
              </div>
              <span className="font-body text-[11px] text-orange-50/90 truncate">
                Tampilkan barcode layar untuk kamera smartphone tamu
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-white/80 text-xl shrink-0">
            arrow_forward
          </span>
        </button>

        {onOpenRSVP && (
          <button
            type="button"
            onClick={onOpenRSVP}
            className="flex items-center justify-between px-4 py-3 rounded-2xl glass-card text-stone-800 border border-white/80 shadow-xs hover:border-orange-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-orange-600 text-xl">
                how_to_reg
              </span>
              <span className="font-body text-[12.5px] font-semibold text-stone-800">
                Formulir RSVP Mandiri
              </span>
            </div>
            <span className="text-[11px] font-bold text-orange-700 flex items-center gap-0.5 ml-2">
              Buka <span className="material-symbols-outlined text-sm">open_in_new</span>
            </span>
          </button>
        )}
      </div>

      {/* Form Guest Entry - Responsive 2 Column on Desktop */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: Guest Profile & Wishes */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* Nama Lengkap */}
          <div className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl glass-card shadow-xs border border-white/90">
            <label
              htmlFor="nama-lengkap"
              className="flex items-center justify-between font-body text-[13px] text-stone-900"
            >
              <span className="font-bold">Nama Lengkap Tamu</span>
              <span className="font-body text-[11px] text-orange-600 font-bold">*Wajib</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-orange-500 text-xl pointer-events-none">
                badge
              </span>
              <input
                id="nama-lengkap"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bpk. H. Bambang Soediro & Istri"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/90 text-stone-900 font-body text-[13.5px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 border border-stone-200/80 shadow-inner"
              />
            </div>
          </div>

          {/* Gender & Pax Counter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Jenis Kelamin / Representasi */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl glass-card shadow-xs border border-white/90">
              <label className="font-body text-[13px] text-stone-900 font-bold">
                Jenis Kelamin / Representasi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('pria')}
                  className={`relative flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    gender === 'pria'
                      ? 'bg-orange-100/90 text-orange-800 border-orange-300 shadow-xs font-bold'
                      : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-orange-600">man</span>
                  <span className="font-body text-[13px]">Pria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('wanita')}
                  className={`relative flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    gender === 'wanita'
                      ? 'bg-rose-100/90 text-rose-800 border-rose-300 shadow-xs font-bold'
                      : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-rose-600">woman</span>
                  <span className="font-body text-[13px]">Wanita</span>
                </button>
              </div>
            </div>

            {/* Jumlah Kehadiran (Pax) */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl glass-card shadow-xs border border-white/90">
              <div className="flex items-center justify-between">
                <label className="font-body text-[13px] text-stone-900 font-bold">
                  Jumlah Orang (Pax)
                </label>
                <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                  {paxCount} Orang
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="grid grid-cols-4 gap-1.5 flex-1">
                  {[1, 2, 3, 4].map((pax) => (
                    <button
                      key={pax}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setPaxCount(pax);
                      }}
                      className={`py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                        paxCount === pax
                          ? 'btn-citrus-primary text-white border-orange-500 shadow-xs'
                          : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-white'
                      }`}
                    >
                      {pax}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-white/90 border border-stone-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setPaxCount((prev) => Math.max(1, prev - 1));
                    }}
                    className="w-7 h-7 rounded flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <span className="w-6 text-center font-bold text-[12px] text-stone-900">
                    {paxCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setPaxCount((prev) => prev + 1);
                    }}
                    className="w-7 h-7 rounded flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Asal Domisili / Relasi Tamu */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl glass-card shadow-xs border border-white/90">
            <label
              htmlFor="asal-tamu"
              className="font-body text-[13px] text-stone-900 font-bold"
            >
              Asal Domisili / Relasi Tamu
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-orange-500 text-xl pointer-events-none">
                location_on
              </span>
              <input
                id="asal-tamu"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Pilih preset di bawah atau ketik langsung"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/90 text-stone-900 font-body text-[13.5px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 border border-stone-200/80 shadow-inner"
              />
            </div>
            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {presetTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setOrigin(tag)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white/90 text-stone-700 font-body text-[11px] font-semibold hover:bg-orange-100 hover:text-orange-800 active:scale-95 transition-colors border border-stone-200/80"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Doa & Ucapan */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl glass-card shadow-xs border border-white/90">
            <label
              htmlFor="doa-pengantin"
              className="font-body text-[13px] text-stone-900 font-bold"
            >
              Doa &amp; Ucapan untuk Kevin &amp; Clarissa
            </label>
            <textarea
              id="doa-pengantin"
              rows={3}
              value={prayerWish}
              onChange={(e) => setPrayerWish(e.target.value)}
              placeholder="Semoga menjadi keluarga sakinah, mawaddah, warrahmah selalu diberkahi kebahagiaan seumur hidup..."
              className="w-full p-2.5 rounded-xl bg-white/90 font-body text-[13px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 border border-stone-200/80 shadow-inner resize-none"
            />
          </div>
        </div>

        {/* Right Column: Envelope, Gifts & Submit Action */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">

          {/* Titipan Amplop Uang */}
          <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl glass-card shadow-xs border border-white/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 shrink-0 border border-orange-200">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-[13px] sm:text-[14px] text-stone-900 font-bold">
                    Titipan Amplop Uang
                  </span>
                  <span className="font-body text-[11px] text-stone-500">
                    Catat nominal uang tunai atau transaksi QRIS
                  </span>
                </div>
              </div>
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEnvelope}
                  onChange={(e) => setHasEnvelope(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {hasEnvelope && (
              <div className="flex flex-col gap-3 pt-2 border-t border-orange-100/80">
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[11px] text-stone-600 font-bold">
                    Nominal Amplop (Rupiah)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-body text-[14px] font-bold text-orange-600">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={nominal}
                      onChange={handleNominalChange}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/90 font-headline text-[18px] text-orange-700 font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 border border-stone-200/80 shadow-inner"
                    />
                  </div>
                </div>

                {/* Quick buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => addQuickNominal(100000)}
                    className="py-1.5 rounded-lg bg-white/90 shadow-2xs font-body text-[11px] text-stone-800 hover:bg-orange-100 active:scale-95 transition-all font-bold border border-stone-200/80"
                  >
                    +100rb
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickNominal(250000)}
                    className="py-1.5 rounded-lg bg-white/90 shadow-2xs font-body text-[11px] text-stone-800 hover:bg-orange-100 active:scale-95 transition-all font-bold border border-stone-200/80"
                  >
                    +250rb
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickNominal(500000)}
                    className="py-1.5 rounded-lg bg-white/90 shadow-2xs font-body text-[11px] text-stone-800 hover:bg-orange-100 active:scale-95 transition-all font-bold border border-stone-200/80"
                  >
                    +500rb
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickNominal(1000000)}
                    className="py-1.5 rounded-lg bg-white/90 shadow-2xs font-body text-[11px] text-stone-800 hover:bg-orange-100 active:scale-95 transition-all font-bold border border-stone-200/80"
                  >
                    +1jt
                  </button>
                </div>

                {/* Method choice */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setEnvelopeMethod('tunai')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      envelopeMethod === 'tunai'
                        ? 'btn-citrus-primary text-white border-orange-500 font-bold shadow-xs'
                        : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">inbox</span>
                    <span className="font-body text-[12px]">Tunai / Kotak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvelopeMethod('qris')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      envelopeMethod === 'qris'
                        ? 'btn-citrus-primary text-white border-orange-500 font-bold shadow-xs'
                        : 'bg-white/80 text-stone-700 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                    <span className="font-body text-[12px]">QRIS / Transfer</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kado / Bingkisan Fisik */}
          <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl glass-card shadow-xs border border-white/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                  <span className="material-symbols-outlined text-xl">redeem</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-[13px] sm:text-[14px] text-stone-900 font-bold">
                    Kado / Bingkisan Fisik
                  </span>
                  <span className="font-body text-[11px] text-stone-500">
                    Beri label penomoran rak souvenir
                  </span>
                </div>
              </div>
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGift}
                  onChange={(e) => setHasGift(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {hasGift && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-amber-100/80">
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[11px] text-stone-600 font-bold">
                    Deskripsi Kado / Bingkisan
                  </label>
                  <input
                    type="text"
                    value={giftDesc}
                    onChange={(e) => setGiftDesc(e.target.value)}
                    placeholder="Contoh: Set Cangkir Keramik & Air Fryer Philips"
                    className="w-full px-3 py-2 rounded-xl bg-white/90 font-body text-[13px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 border border-stone-200/80 shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="font-body text-[11px] text-stone-600 font-bold">
                      Nomor Label Rak
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-amber-600 text-lg pointer-events-none">
                        shelves
                      </span>
                      <input
                        type="text"
                        value={giftRack}
                        onChange={(e) => setGiftRack(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 font-body text-[13.5px] font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 border border-stone-200/80 shadow-inner"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoNextRack}
                    className="self-end px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-body text-[11.5px] font-bold active:scale-95 transition-transform border border-stone-200"
                  >
                    Auto Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-6 rounded-2xl btn-citrus-primary text-white shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all font-bold font-body text-[14px]"
            >
              <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
              <span className="tracking-wide">
                Simpan Tamu (Sync Firebase)
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
