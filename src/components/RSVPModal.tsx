import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Guest, EnvelopeMethod } from '../types';
import { sound } from '../utils/sound';

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRSVP: (guest: Guest) => void;
}

export const RSVPModal: React.FC<RSVPModalProps> = ({
  isOpen,
  onClose,
  onSubmitRSVP,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'pria' | 'wanita'>('pria');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Sahabat Mempelai');
  const [attendance, setAttendance] = useState<'hadir' | 'ragu' | 'tidak_hadir'>('hadir');
  const [paxCount, setPaxCount] = useState<number>(2);
  const [prayerWish, setPrayerWish] = useState('');
  
  // Digital Envelope state
  const [giveEnvelope, setGiveEnvelope] = useState(false);
  const [envelopeMethod, setEnvelopeMethod] = useState<EnvelopeMethod>('qris');
  const [nominal, setNominal] = useState('500.000');
  const [hasGift, setHasGift] = useState(false);
  const [giftDescription, setGiftDescription] = useState('');
  
  // Post-submission success ticket
  const [submittedGuest, setSubmittedGuest] = useState<Guest | null>(null);
  const [ticketQrUrl, setTicketQrUrl] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  const quickWishes = [
    'Barakallahu lakum wa baraka alaikum. Semoga sakinah, mawaddah wa rahmah.',
    'Selamat menempuh hidup baru Kevin & Clarissa! Bahagia selalu selamanya.',
    'Happy wedding Kevin & Clarissa! Semoga cinta kalian abadi hingga kakek nenek.',
  ];

  const relationOptions = [
    'Sahabat Kevin',
    'Sahabat Clarissa',
    'Rekan Kantor',
    'Keluarga Mempelai Pria',
    'Keluarga Mempelai Wanita',
    'Undangan VIP / Umum',
  ];

  const parseRupiah = (val: string) => {
    return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Generate QR for e-ticket when guest submitted
  useEffect(() => {
    if (submittedGuest) {
      const ticketPayload = JSON.stringify({
        ticketId: `TKT-${submittedGuest.id}`,
        event: 'The Wedding of Kevin & Clarissa',
        name: submittedGuest.name,
        pax: submittedGuest.paxCount || 1,
        time: submittedGuest.time,
        coupon: `SOUV-${submittedGuest.id.slice(-6).toUpperCase()}`,
      });

      QRCode.toDataURL(ticketPayload, {
        width: 220,
        margin: 1,
        color: {
          dark: '#1b1b21',
          light: '#ffffff',
        },
      })
        .then((url) => setTicketQrUrl(url))
        .catch((err) => console.error('Error generating ticket QR:', err));
    }
  }, [submittedGuest]);

  if (!isOpen) return null;

  const handleCopyAccount = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    sound.playTap();
    setCopiedBank(label);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playCheckInChime();

    // Haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 30, 60]);
    }

    // Celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#c5a059', '#775a19', '#92484f', '#ffdea5'],
    });

    const envelopeAmount = giveEnvelope ? parseRupiah(nominal) : 0;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const newGuest: Guest = {
      id: `rsvp-${Date.now()}`,
      name: name.trim(),
      gender,
      origin: relation,
      category: relation.includes('VIP') ? 'VIP' : relation.includes('Keluarga') ? 'Keluarga' : 'Reguler',
      time: timeFormatted,
      timestamp: Date.now(),
      hasEnvelope: giveEnvelope && envelopeAmount > 0,
      envelopeNominal: giveEnvelope && envelopeAmount > 0 ? envelopeAmount : undefined,
      envelopeMethod: giveEnvelope ? envelopeMethod : undefined,
      hasGift: hasGift && giftDescription.trim().length > 0,
      giftDescription: hasGift ? giftDescription.trim() : undefined,
      giftShelf: hasGift ? 'R-RSVP' : undefined,
      prayerWish: prayerWish.trim() || undefined,
      checkedInBy: 'RSVP Mandiri (Online)',
      isVerified: true,
      paxCount: attendance === 'tidak_hadir' ? 0 : paxCount,
      phone: phone.trim() || undefined,
      rsvpStatus: attendance,
      isRsvp: true,
    };

    onSubmitRSVP(newGuest);
    setSubmittedGuest(newGuest);
  };

  const handleResetForm = () => {
    setSubmittedGuest(null);
    setName('');
    setGender('pria');
    setPhone('');
    setPrayerWish('');
    setGiveEnvelope(false);
    setHasGift(false);
    onClose();
  };

  const handleShareToWhatsApp = () => {
    if (!submittedGuest) return;
    sound.playTap();

    const voucherCode = `SOUV-${submittedGuest.id.slice(-6).toUpperCase()}`;
    const text = `*E-Pass Kehadiran & Kupon Souvenir*\n` +
      `The Wedding of Kevin & Clarissa\n` +
      `───────────────────────\n` +
      `Nama Tamu: *${submittedGuest.name}*\n` +
      `Kehadiran: *${attendance === 'hadir' ? 'Hadir (' + submittedGuest.paxCount + ' Orang)' : attendance}*\n` +
      `Kode Kupon Souvenir: *${voucherCode}*\n` +
      `Lokasi: Grand Ballroom Hotel Mulia Senayan, Jakarta\n` +
      `Waktu: 20 September 2026\n` +
      `───────────────────────\n` +
      `Tunjukkan pesan / QR ini di meja penerima tamu untuk penukaran souvenir.`;

    const encoded = encodeURIComponent(text);
    const targetPhone = phone.replace(/[^0-9]/g, '');
    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="glass-card bg-white/95 text-stone-900 w-full max-w-lg md:max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-orange-200 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Elegance */}
        <div className="relative bg-gradient-to-br from-stone-900 via-orange-950 to-stone-900 text-white p-5 sm:p-6 text-center shrink-0 border-b border-orange-500/20">
          <button
            type="button"
            onClick={handleResetForm}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-orange-500/20 border border-orange-400/50 mb-2 shadow-xs">
            <span className="font-headline text-base font-bold text-orange-300">K &amp; C</span>
          </div>

          <h2 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-orange-100 leading-tight">
            The Wedding of Kevin &amp; Clarissa
          </h2>
          <p className="font-body text-xs text-orange-200/80 mt-1">
            Minggu, 20 September 2026 • Grand Ballroom Hotel Mulia
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-orange-400/30 text-xs font-semibold text-orange-200">
            <span className="material-symbols-outlined text-sm text-orange-400">edit_note</span>
            <span>Form RSVP &amp; Buku Tamu Mandiri</span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-body text-xs sm:text-sm">
          
          {/* SUCCESS SCREEN / E-PASS TICKET */}
          {submittedGuest ? (
            <div className="flex flex-col items-center text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>

              <div>
                <h3 className="font-headline text-xl font-bold text-stone-900">
                  Konfirmasi RSVP Berhasil!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Terima kasih atas doa dan konfirmasi kehadiran Anda di hari bahagia Kevin &amp; Clarissa.
                </p>
              </div>

              {/* Digital Pass / E-Ticket Card */}
              <div className="w-full max-w-md bg-gradient-to-br from-orange-50/90 to-amber-50/50 rounded-2xl p-4 sm:p-5 border border-orange-200 shadow-md relative overflow-hidden text-left space-y-3">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-orange-400/10 pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-orange-200 pb-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-orange-800">
                      E-Pass &amp; Kupon Souvenir
                    </span>
                    <span className="font-headline text-base font-bold text-stone-900">
                      {submittedGuest.name}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-2xs">
                    {attendance === 'hadir' ? `${submittedGuest.paxCount} Orang` : 'Tercatat'}
                  </span>
                </div>

                {/* QR Code Canvas / Image */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-orange-200/80 shadow-xs">
                  {ticketQrUrl ? (
                    <img
                      src={ticketQrUrl}
                      alt="QR Tiket Tamu"
                      className="w-40 h-40 object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined animate-spin text-3xl text-orange-500">sync</span>
                    </div>
                  )}
                  <span className="font-mono text-xs font-bold text-orange-800 tracking-wider mt-2">
                    #SOUV-{submittedGuest.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-[11px] text-stone-500 text-center mt-0.5">
                    Tunjukkan kode QR ini kepada petugas di meja souvenir
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-stone-500 block text-[11px]">Waktu Check-In:</span>
                    <span className="font-bold text-stone-900">{submittedGuest.time}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[11px]">Status:</span>
                    <span className="font-bold text-emerald-700">Terkonfirmasi Hadir</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Guest */}
              <div className="w-full max-w-md space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                  <span>Simpan E-Tiket ke WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-98 transition-transform"
                >
                  Selesai &amp; Kembali ke Halaman Utama
                </button>
              </div>
            </div>
          ) : (
            /* RSVP FORM FIELDS */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Salutation / Intro Note */}
              <div className="p-3 sm:p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl text-xs text-orange-950 leading-relaxed">
                Tanpa mengurangi rasa hormat, mohon berkenan mengonfirmasi kehadiran Anda demi kenyamanan dan kelancaran acara resepsi.
              </div>

              {/* Responsive 2-column grid for Name and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Tamu */}
                <div className="space-y-1">
                  <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                    Nama Tamu / Keluarga <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Bpk. Bambang Sutrisno &amp; Istri"
                      className="w-full pl-9 pr-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                </div>

                {/* Pilihan Gender */}
                <div className="space-y-1">
                  <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setGender('pria');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        gender === 'pria'
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-orange-50/40 text-stone-600 border-orange-200 hover:bg-orange-100/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">man</span>
                      <span>Pria / Bapak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setGender('wanita');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        gender === 'wanita'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-orange-50/40 text-stone-600 border-orange-200 hover:bg-orange-100/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">woman</span>
                      <span>Wanita / Ibu</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Responsive 2-column grid for WhatsApp and Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nomor WhatsApp */}
                <div className="space-y-1">
                  <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                    Nomor WhatsApp <span className="text-xs text-stone-500 font-normal">(Untuk kupon)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                      chat
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-9 pr-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                </div>

                {/* Relasi / Kategori Tamu */}
                <div className="space-y-1">
                  <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                    Hubungan / Relasi
                  </label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs sm:text-sm text-stone-900"
                  >
                    {relationOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Konfirmasi Kehadiran */}
              <div className="space-y-2 pt-1">
                <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                  Konfirmasi Kehadiran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setAttendance('hadir');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      attendance === 'hadir'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md'
                        : 'bg-white text-stone-600 border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span>Pasti Hadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setAttendance('ragu');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      attendance === 'ragu'
                        ? 'bg-amber-100 text-amber-900 border-amber-500 shadow-xs'
                        : 'bg-white text-stone-600 border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">help</span>
                    <span>Masih Ragu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setAttendance('tidak_hadir');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      attendance === 'tidak_hadir'
                        ? 'bg-rose-100 text-rose-900 border-rose-400 shadow-xs'
                        : 'bg-white text-stone-600 border-orange-200 hover:bg-orange-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    <span>Tidak Hadir</span>
                  </button>
                </div>
              </div>

              {/* Jumlah Pax (Jika hadir atau ragu) */}
              {attendance !== 'tidak_hadir' && (
                <div className="space-y-1.5 bg-orange-50/50 p-3 rounded-xl border border-orange-200">
                  <label className="block font-semibold text-stone-900 text-xs">
                    Jumlah Orang yang Hadir
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setPaxCount(num);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          paxCount === num
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-orange-200'
                        }`}
                      >
                        {num === 4 ? '4+ Orang' : `${num} Orang`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ucapan & Doa Restu */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-stone-900 text-xs sm:text-sm">
                  Ucapan &amp; Doa Restu untuk Kedua Mempelai
                </label>
                <textarea
                  rows={2}
                  value={prayerWish}
                  onChange={(e) => setPrayerWish(e.target.value)}
                  placeholder="Tuliskan ucapan selamat atau doa restu..."
                  className="w-full p-2.5 bg-orange-50/40 rounded-xl border border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-400/40 outline-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400"
                ></textarea>

                {/* Quick wish templates */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {quickWishes.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrayerWish(w)}
                      className="text-[11px] text-orange-900 bg-orange-100/70 hover:bg-orange-200 px-2.5 py-1 rounded-lg shrink-0 truncate max-w-[220px] transition-colors"
                    >
                      "{w.slice(0, 30)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanda Kasih & Amplop Digital (Cashless) */}
              <div className="border border-orange-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div
                  onClick={() => setGiveEnvelope(!giveEnvelope)}
                  className="p-3 sm:p-3.5 bg-orange-50/60 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-orange-600 text-xl">
                      redeem
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs sm:text-sm text-stone-900">
                        Kirim Tanda Kasih / Amplop Digital
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Titipan amplop via QRIS atau Transfer Bank Mempelai
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={giveEnvelope}
                    onChange={(e) => setGiveEnvelope(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                  />
                </div>

                {giveEnvelope && (
                  <div className="p-3 sm:p-4 space-y-3 bg-white border-t border-orange-200">
                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEnvelopeMethod('qris')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          envelopeMethod === 'qris'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                            : 'bg-orange-50/40 text-stone-700 border-orange-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">qr_code_2</span>
                        <span>QRIS Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEnvelopeMethod('transfer')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                          envelopeMethod === 'transfer'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                            : 'bg-orange-50/40 text-stone-700 border-orange-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">account_balance</span>
                        <span>Transfer Bank</span>
                      </button>
                    </div>

                    {/* QRIS Display or Bank Transfer Details */}
                    {envelopeMethod === 'qris' ? (
                      <div className="p-4 bg-orange-50/40 rounded-xl flex flex-col items-center text-center space-y-2 border border-orange-200">
                        <div className="bg-white p-3 rounded-xl shadow-xs border border-orange-200/80">
                          <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=00020101021126580016ID.CO.QRIS.WWW0118936009988210988210214882109882190015204581253033605802ID5914KEVIN_CLARISSA6007JAKARTA6304E8A2"
                            alt="QRIS Wedding Kevin & Clarissa"
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          QRIS Wedding Kevin &amp; Clarissa
                        </span>
                        <span className="text-[11px] text-stone-500 max-w-xs">
                          Bisa di-scan menggunakan GoPay, OVO, BCA Mobile, Livin Mandiri, atau Dana
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Rekening BCA */}
                        <div className="p-3 bg-orange-50/40 rounded-xl flex items-center justify-between border border-orange-200">
                          <div>
                            <span className="text-[10px] font-bold text-orange-800 block uppercase tracking-wide">
                              Bank Central Asia (BCA)
                            </span>
                            <span className="font-mono text-sm font-bold text-stone-900">
                              8821 0988 21
                            </span>
                            <span className="text-[11px] text-stone-500 block">a/n Kevin Pratama</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount('8821098821', 'BCA')}
                            className="px-3 py-1.5 bg-white border border-orange-200 hover:bg-orange-50 rounded-lg text-xs font-bold text-orange-800 flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                            Salin
                          </button>
                        </div>

                        {/* Rekening Mandiri */}
                        <div className="p-3 bg-orange-50/40 rounded-xl flex items-center justify-between border border-orange-200">
                          <div>
                            <span className="text-[10px] font-bold text-orange-800 block uppercase tracking-wide">
                              Bank Mandiri
                            </span>
                            <span className="font-mono text-sm font-bold text-stone-900">
                              137 00 1928 333
                            </span>
                            <span className="text-[11px] text-stone-500 block">a/n Clarissa Wijaya</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount('137001928333', 'Mandiri')}
                            className="px-3 py-1.5 bg-white border border-orange-200 hover:bg-orange-50 rounded-lg text-xs font-bold text-orange-800 flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                            Salin
                          </button>
                        </div>

                        {showCopyFeedback && (
                          <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center font-semibold border border-emerald-200">
                            Nomor rekening {copiedBank} berhasil disalin!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nominal Selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-stone-900">
                        Nominal Tanda Kasih (Rp)
                      </label>
                      <input
                        type="text"
                        value={nominal}
                        onChange={(e) => {
                          const raw = parseRupiah(e.target.value);
                          setNominal(raw === 0 ? '' : formatRupiah(raw));
                        }}
                        className="w-full px-3 py-2 bg-orange-50/40 rounded-xl border border-orange-200 text-sm font-bold text-orange-700 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none"
                      />
                      <div className="flex items-center gap-2">
                        {[200000, 500000, 1000000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setNominal(formatRupiah(amt))}
                            className="text-xs bg-orange-100/60 hover:bg-orange-200 text-orange-950 font-semibold px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Rp {formatRupiah(amt)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Kado Fisik Checkbox */}
              <div className="p-3 sm:p-3.5 bg-orange-50/40 rounded-xl border border-orange-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-stone-900">
                  <input
                    type="checkbox"
                    checked={hasGift}
                    onChange={(e) => setHasGift(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded"
                  />
                  <span>Membawa Bingkisan / Kado Fisik Langsung</span>
                </label>

                {hasGift && (
                  <input
                    type="text"
                    value={giftDescription}
                    onChange={(e) => setGiftDescription(e.target.value)}
                    placeholder="Contoh: Kado Peralatan Dapur / Tea Set"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-orange-200 text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 outline-none text-stone-900"
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-xl">send</span>
                <span>Kirim RSVP &amp; Dapatkan Kupon Souvenir</span>
              </button>

              <p className="text-[11px] text-stone-500 text-center">
                Data akan otomatis tercatat ke buku resepsi meja tamu.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
