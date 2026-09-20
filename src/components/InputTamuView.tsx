import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Guest, Gender, EnvelopeMethod } from '../types';
import { sound } from '../utils/sound';

interface InputTamuViewProps {
  guestCount: number;
  onGuestCreated: (newGuest: Guest) => void;
  onOpenQRScan: () => void;
  initialPrefill?: Partial<Guest> | null;
}

export const InputTamuView: React.FC<InputTamuViewProps> = ({
  guestCount,
  onGuestCreated,
  onOpenQRScan,
  initialPrefill,
}) => {
  const [name, setName] = useState(initialPrefill?.name || '');
  const [gender, setGender] = useState<Gender>(initialPrefill?.gender || 'pria');
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
    <div className="flex flex-col w-full max-w-md mx-auto pb-28">
      {/* Desk status banner */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-[#eae7ef] via-[#efecf5] to-[#eae7ef] border-b border-[#e4e1ea]/60 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#775a19]/10 text-[#775a19] shrink-0">
              <span className="material-symbols-outlined text-lg">desk</span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[10px] text-[#7f7667] uppercase tracking-wider font-semibold">
                Meja Resepsionis A
              </span>
              <span className="font-body text-[13px] text-[#1b1b21] font-bold truncate">
                Penerimaan Tamu Undangan
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xs shrink-0 border border-[#e4e1ea]/60">
            <span className="inline-block w-2 h-2 rounded-full bg-[#775a19] animate-pulse"></span>
            <span className="font-body text-[11px] text-[#7f7667]">Tercatat:</span>
            <span className="font-body text-[11px] text-[#775a19] font-bold">
              {guestCount}
            </span>
          </div>
        </div>
      </div>

      {/* Success Toast Modal */}
      {showSuccessToast && lastSavedGuest && (
        <div className="fixed inset-x-4 top-24 z-50 transition-all duration-300 max-w-md mx-auto animate-in fade-in slide-in-from-top-4">
          <div className="p-4 rounded-2xl bg-white shadow-2xl flex items-center gap-3 border-l-4 border-[#775a19] ring-1 ring-black/5">
            <div className="w-10 h-10 rounded-full bg-[#ffdea5] flex items-center justify-center text-[#261900] shrink-0">
              <span className="material-symbols-outlined text-2xl fill-1">cloud_done</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-body text-[13px] font-bold text-[#1b1b21]">
                Data Berhasil Masuk!
              </span>
              <span className="font-body text-[11px] text-[#7f7667] truncate">
                {lastSavedGuest.name} tersimpan ke Cloud Firestore &amp; Kupon tercetak.
              </span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="w-7 h-7 rounded-full bg-[#efecf5] flex items-center justify-center text-[#7f7667] hover:text-[#1b1b21]"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* QR Tamu & RSVP Banner Button */}
      <div className="px-4 mt-3">
        <button
          type="button"
          onClick={onOpenQRScan}
          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-[#775a19] via-[#8c6a1e] to-[#92484f] text-white shadow-md active:scale-[0.98] transition-transform border border-[#ffdea5]/30"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl text-[#ffdea5]">
                qr_code_2
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-body text-[13.5px] font-bold text-white">
                  QR Tamu &amp; RSVP Digital
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-[#ffdea5] text-[#261900]">
                  Scan HP
                </span>
              </div>
              <span className="font-body text-[11px] text-[#ffdea5]/90 truncate">
                Tampilkan QR meja untuk kamera HP tamu (Form RSVP)
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-white/80 text-xl shrink-0">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Form Guest Entry */}
      <form onSubmit={handleSubmit} className="px-4 mt-3 flex flex-col gap-3">
        {/* Nama Lengkap */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#f5f2fb] shadow-xs border border-[#e4e1ea]/50">
          <label
            htmlFor="nama-lengkap"
            className="flex items-center justify-between font-body text-[13px] text-[#1b1b21]"
          >
            <span className="font-bold">Nama Lengkap Tamu</span>
            <span className="font-body text-[11px] text-[#92484f] font-bold">*Wajib</span>
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[#775a19] text-xl pointer-events-none">
              badge
            </span>
            <input
              id="nama-lengkap"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Bpk. H. Bambang Soediro & Istri"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white text-[#1b1b21] font-body text-[13.5px] placeholder:text-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#775a19] border border-[#e4e1ea]/60 shadow-inner"
            />
          </div>
        </div>

        {/* Jenis Kelamin / Representasi */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#f5f2fb] shadow-xs border border-[#e4e1ea]/50">
          <label className="font-body text-[13px] text-[#1b1b21] font-bold">
            Jenis Kelamin / Representasi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('pria')}
              className={`relative flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${
                gender === 'pria'
                  ? 'bg-[#ffdea5] text-[#261900] border-[#c5a059] shadow-sm font-bold'
                  : 'bg-white text-[#1b1b21] border-[#e4e1ea]/60'
              }`}
            >
              <span className="material-symbols-outlined text-xl text-[#775a19]">man</span>
              <span className="font-body text-[13px]">Pria</span>
            </button>

            <button
              type="button"
              onClick={() => setGender('wanita')}
              className={`relative flex items-center justify-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${
                gender === 'wanita'
                  ? 'bg-[#ffdadb] text-[#3c0610] border-[#92484f] shadow-sm font-bold'
                  : 'bg-white text-[#1b1b21] border-[#e4e1ea]/60'
              }`}
            >
              <span className="material-symbols-outlined text-xl text-[#92484f]">woman</span>
              <span className="font-body text-[13px]">Wanita</span>
            </button>
          </div>
        </div>

        {/* Asal Domisili / Relasi Tamu */}
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#f5f2fb] shadow-xs border border-[#e4e1ea]/50">
          <label
            htmlFor="asal-tamu"
            className="font-body text-[13px] text-[#1b1b21] font-bold"
          >
            Asal Domisili / Relasi Tamu
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[#775a19] text-xl pointer-events-none">
              location_on
            </span>
            <input
              id="asal-tamu"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Pilih preset di bawah atau ketik langsung"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white text-[#1b1b21] font-body text-[13.5px] placeholder:text-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#775a19] border border-[#e4e1ea]/60 shadow-inner"
            />
          </div>
          {/* Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {presetTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setOrigin(tag)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#eae7ef] text-[#4e4639] font-body text-[11px] font-semibold hover:bg-[#ffdea5] hover:text-[#261900] active:scale-95 transition-colors border border-[#e4e1ea]/60"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Titipan Amplop Uang */}
        <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#f5f2fb] shadow-xs border border-[#e4e1ea]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#775a19] text-2xl">mail</span>
              <div className="flex flex-col">
                <span className="font-body text-[13px] text-[#1b1b21] font-bold">
                  Titipan Amplop Uang
                </span>
                <span className="font-body text-[11px] text-[#7f7667]">
                  Catat nominal &amp; penyerahan fisik/QRIS
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
              <div className="w-11 h-6 bg-[#e4e1ea] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#775a19]"></div>
            </label>
          </div>

          {hasEnvelope && (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex flex-col gap-1">
                <label className="font-body text-[11px] text-[#7f7667]">
                  Nominal Uang (Rupiah)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-body text-[14px] font-bold text-[#775a19]">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={nominal}
                    onChange={handleNominalChange}
                    className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white font-headline text-[18px] text-[#775a19] font-bold focus:outline-none focus:ring-2 focus:ring-[#775a19] border border-[#e4e1ea]/60 shadow-inner"
                  />
                </div>
              </div>

              {/* Quick buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => addQuickNominal(100000)}
                  className="py-1.5 rounded-lg bg-white shadow-xs font-body text-[11px] text-[#1b1b21] hover:bg-[#ffdea5] active:scale-95 transition-all font-bold border border-[#e4e1ea]/60"
                >
                  +100rb
                </button>
                <button
                  type="button"
                  onClick={() => addQuickNominal(250000)}
                  className="py-1.5 rounded-lg bg-white shadow-xs font-body text-[11px] text-[#1b1b21] hover:bg-[#ffdea5] active:scale-95 transition-all font-bold border border-[#e4e1ea]/60"
                >
                  +250rb
                </button>
                <button
                  type="button"
                  onClick={() => addQuickNominal(500000)}
                  className="py-1.5 rounded-lg bg-white shadow-xs font-body text-[11px] text-[#1b1b21] hover:bg-[#ffdea5] active:scale-95 transition-all font-bold border border-[#e4e1ea]/60"
                >
                  +500rb
                </button>
                <button
                  type="button"
                  onClick={() => addQuickNominal(1000000)}
                  className="py-1.5 rounded-lg bg-white shadow-xs font-body text-[11px] text-[#1b1b21] hover:bg-[#ffdea5] active:scale-95 transition-all font-bold border border-[#e4e1ea]/60"
                >
                  +1jt
                </button>
              </div>

              {/* Method choice */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEnvelopeMethod('tunai')}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                    envelopeMethod === 'tunai'
                      ? 'bg-[#775a19] text-white border-[#775a19] font-bold shadow-xs'
                      : 'bg-white text-[#1b1b21] border-[#e4e1ea]/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">inbox</span>
                  <span className="font-body text-[11.5px]">Tunai / Kotak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnvelopeMethod('qris')}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                    envelopeMethod === 'qris'
                      ? 'bg-[#775a19] text-white border-[#775a19] font-bold shadow-xs'
                      : 'bg-white text-[#1b1b21] border-[#e4e1ea]/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">account_balance</span>
                  <span className="font-body text-[11.5px]">QRIS / Transfer</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kado / Bingkisan Fisik */}
        <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#f5f2fb] shadow-xs border border-[#e4e1ea]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#92484f] text-2xl">redeem</span>
              <div className="flex flex-col">
                <span className="font-body text-[13px] text-[#1b1b21] font-bold">
                  Kado / Bingkisan Fisik
                </span>
                <span className="font-body text-[11px] text-[#7f7667]">
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
              <div className="w-11 h-6 bg-[#e4e1ea] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#92484f]"></div>
            </label>
          </div>

          {hasGift && (
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex flex-col gap-1">
                <label className="font-body text-[11px] text-[#7f7667]">
                  Deskripsi Kado / Bingkisan
                </label>
                <input
                  type="text"
                  value={giftDesc}
                  onChange={(e) => setGiftDesc(e.target.value)}
                  placeholder="Contoh: Set Cangkir Keramik & Air Fryer Philips"
                  className="w-full px-3 py-2 rounded-lg bg-white font-body text-[13px] text-[#1b1b21] placeholder:text-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#92484f] border border-[#e4e1ea]/60 shadow-inner"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-body text-[11px] text-[#7f7667]">
                    Nomor Label Rak
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#92484f] text-lg pointer-events-none">
                      shelves
                    </span>
                    <input
                      type="text"
                      value={giftRack}
                      onChange={(e) => setGiftRack(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white font-body text-[13.5px] font-bold text-[#92484f] focus:outline-none focus:ring-2 focus:ring-[#92484f] border border-[#e4e1ea]/60 shadow-inner"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoNextRack}
                  className="self-end px-3 py-2 rounded-lg bg-[#eae7ef] text-[#4e4639] font-body text-[11.5px] font-bold active:scale-95 transition-transform border border-[#e4e1ea]/60"
                >
                  Auto Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Doa & Ucapan */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#f5f2fb] shadow-xs border border-[#e4e1ea]/50">
          <label
            htmlFor="doa-pengantin"
            className="font-body text-[13px] text-[#1b1b21] font-bold"
          >
            Doa &amp; Ucapan untuk Kevin &amp; Clarissa
          </label>
          <textarea
            id="doa-pengantin"
            rows={3}
            value={prayerWish}
            onChange={(e) => setPrayerWish(e.target.value)}
            placeholder="Semoga menjadi keluarga sakinah, mawaddah, warrahmah selalu diberkahi kebahagiaan seumur hidup..."
            className="w-full p-2.5 rounded-lg bg-white font-body text-[13px] text-[#1b1b21] placeholder:text-[#d1c5b4] focus:outline-none focus:ring-2 focus:ring-[#775a19] border border-[#e4e1ea]/60 shadow-inner resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#c5a059] hover:bg-[#b8860b] text-[#4e3700] shadow-lg active:scale-[0.98] transition-all font-bold"
          >
            <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
            <span className="font-body text-[13px] uppercase tracking-wider">
              Simpan Data Tamu (Sync Firebase)
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
