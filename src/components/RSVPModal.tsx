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
      gender: 'pria',
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
      checkedInBy: 'RSVP Mandiri (Mobile)',
      isVerified: true,
      paxCount: attendance === 'tidak_hadir' ? 0 : paxCount,
    };

    onSubmitRSVP(newGuest);
    setSubmittedGuest(newGuest);
  };

  const handleResetForm = () => {
    setSubmittedGuest(null);
    setName('');
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white text-[#1b1b21] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[#e4e1ea] my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Elegance */}
        <div className="relative bg-gradient-to-br from-[#261900] via-[#473600] to-[#775a19] text-white p-5 text-center shrink-0">
          <button
            type="button"
            onClick={handleResetForm}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-[#ffdea5]/40 mb-2">
            <span className="font-headline text-[15px] font-bold text-[#ffdea5]">K &amp; C</span>
          </div>

          <h2 className="font-headline text-[19px] sm:text-[21px] font-semibold tracking-tight text-[#ffdea5] leading-tight">
            The Wedding of Kevin &amp; Clarissa
          </h2>
          <p className="font-body text-[11.5px] text-white/80 mt-1">
            Minggu, 20 September 2026 • Grand Ballroom Hotel Mulia
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/15 text-[11px] font-medium text-[#ffe088]">
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span>Form RSVP &amp; Buku Tamu Mandiri</span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-body text-[13px]">
          
          {/* SUCCESS SCREEN / E-PASS TICKET */}
          {submittedGuest ? (
            <div className="flex flex-col items-center text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-[#ffdea5] text-[#261900] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl fill-1">check_circle</span>
              </div>

              <div>
                <h3 className="font-headline text-[18px] font-bold text-[#1b1b21]">
                  Konfirmasi RSVP Berhasil!
                </h3>
                <p className="text-[12px] text-[#7f7667] mt-1 max-w-xs mx-auto">
                  Terima kasih atas doa dan konfirmasi kehadiran Anda di hari bahagia Kevin &amp; Clarissa.
                </p>
              </div>

              {/* Digital Pass / E-Ticket Card */}
              <div className="w-full bg-[#fdfbf7] rounded-2xl p-4 border border-[#e9c176]/80 shadow-md relative overflow-hidden text-left space-y-3">
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#ffdea5]/30 pointer-events-none"></div>

                <div className="flex items-center justify-between border-b border-[#e9c176]/40 pb-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#775a19]">
                      E-Pass &amp; Kupon Souvenir
                    </span>
                    <span className="font-headline text-[15px] font-bold text-[#1b1b21]">
                      {submittedGuest.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#775a19] text-white text-[10.5px] font-bold">
                    {attendance === 'hadir' ? `${submittedGuest.paxCount} Orang` : 'Tercatat'}
                  </span>
                </div>

                {/* QR Code Canvas / Image */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#e4e1ea]">
                  {ticketQrUrl ? (
                    <img
                      src={ticketQrUrl}
                      alt="QR Tiket Tamu"
                      className="w-36 h-36 object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                    </div>
                  )}
                  <span className="font-mono text-[11px] font-bold text-[#775a19] tracking-wider mt-1.5">
                    #SOUV-{submittedGuest.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[#7f7667] text-center mt-0.5">
                    Tunjukkan kode QR ini kepada petugas di meja souvenir
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-[#7f7667] block">Waktu Check-In:</span>
                    <span className="font-bold text-[#1b1b21]">{submittedGuest.time}</span>
                  </div>
                  <div>
                    <span className="text-[#7f7667] block">Status:</span>
                    <span className="font-bold text-emerald-700">Terkonfirmasi Hadir</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Guest */}
              <div className="w-full space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span>Simpan E-Tiket ke WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#775a19] text-white font-bold text-[13px] shadow-sm active:scale-98 transition-transform"
                >
                  Selesai &amp; Kembali ke Halaman Utama
                </button>
              </div>
            </div>
          ) : (
            /* RSVP FORM FIELDS */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Salutation / Intro Note */}
              <div className="p-3 bg-[#fdfaf3] border border-[#e9c176]/50 rounded-xl text-[12px] text-[#4e4639] leading-relaxed">
                Tanpa mengurangi rasa hormat, mohon berkenan mengonfirmasi kehadiran Anda demi kenyamanan dan kelancaran acara resepsi.
              </div>

              {/* Nama Tamu */}
              <div className="space-y-1">
                <label className="block font-semibold text-[#1b1b21] text-[12.5px]">
                  Nama Tamu / Keluarga <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7f7667] text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Bpk. Bambang Sutrisno &amp; Istri"
                    className="w-full pl-9 pr-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 focus:border-[#775a19] outline-none text-[13px]"
                  />
                </div>
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-1">
                <label className="block font-semibold text-[#1b1b21] text-[12.5px]">
                  Nomor WhatsApp <span className="text-[11px] text-[#7f7667] font-normal">(Untuk kirim kupon souvenir)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7f7667] text-[18px]">
                    chat
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 focus:border-[#775a19] outline-none text-[13px]"
                  />
                </div>
              </div>

              {/* Relasi / Kategori Tamu */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#1b1b21] text-[12.5px]">
                  Hubungan / Relasi
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {relationOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setRelation(opt);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        relation === opt
                          ? 'bg-[#775a19] text-white shadow-xs'
                          : 'bg-[#efecf5] text-[#4e4639] hover:bg-[#e4e1ea]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Konfirmasi Kehadiran */}
              <div className="space-y-2 pt-1">
                <label className="block font-semibold text-[#1b1b21] text-[12.5px]">
                  Konfirmasi Kehadiran <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setAttendance('hadir');
                    }}
                    className={`py-2 px-1 rounded-xl text-[11.5px] font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      attendance === 'hadir'
                        ? 'bg-[#ffdea5] text-[#261900] border-[#775a19] shadow-xs'
                        : 'bg-white text-[#7f7667] border-[#e4e1ea] hover:bg-[#f5f2fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Pasti Hadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setAttendance('ragu');
                    }}
                    className={`py-2 px-1 rounded-xl text-[11.5px] font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      attendance === 'ragu'
                        ? 'bg-amber-100 text-amber-900 border-amber-500 shadow-xs'
                        : 'bg-white text-[#7f7667] border-[#e4e1ea] hover:bg-[#f5f2fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span>Masih Ragu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setAttendance('tidak_hadir');
                    }}
                    className={`py-2 px-1 rounded-xl text-[11.5px] font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      attendance === 'tidak_hadir'
                        ? 'bg-rose-100 text-rose-900 border-rose-400 shadow-xs'
                        : 'bg-white text-[#7f7667] border-[#e4e1ea] hover:bg-[#f5f2fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Tidak Hadir</span>
                  </button>
                </div>
              </div>

              {/* Jumlah Pax (Jika hadir atau ragu) */}
              {attendance !== 'tidak_hadir' && (
                <div className="space-y-1.5 bg-[#f5f2fb] p-3 rounded-xl border border-[#e4e1ea]">
                  <label className="block font-semibold text-[#1b1b21] text-[12px]">
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
                            ? 'bg-[#775a19] text-white shadow-xs'
                            : 'bg-white text-[#4e4639] border border-[#e4e1ea]'
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
                <label className="block font-semibold text-[#1b1b21] text-[12.5px]">
                  Ucapan &amp; Doa Restu untuk Kedua Mempelai
                </label>
                <textarea
                  rows={2}
                  value={prayerWish}
                  onChange={(e) => setPrayerWish(e.target.value)}
                  placeholder="Tuliskan ucapan selamat atau doa restu..."
                  className="w-full p-2.5 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] focus:bg-white focus:ring-2 focus:ring-[#775a19]/40 outline-none text-[12.5px]"
                ></textarea>

                {/* Quick wish templates */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {quickWishes.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrayerWish(w)}
                      className="text-[10px] text-[#775a19] bg-[#ffdea5]/40 hover:bg-[#ffdea5] px-2 py-0.5 rounded-md shrink-0 truncate max-w-[200px]"
                    >
                      "{w.slice(0, 30)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanda Kasih & Amplop Digital (Cashless) */}
              <div className="border border-[#e4e1ea] rounded-xl overflow-hidden bg-white">
                <div
                  onClick={() => setGiveEnvelope(!giveEnvelope)}
                  className="p-3 bg-[#fdfaf3] flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#775a19] text-xl">
                      redeem
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-[12.5px] text-[#1b1b21]">
                        Kirim Tanda Kasih / Amplop Digital
                      </span>
                      <span className="text-[10.5px] text-[#7f7667]">
                        Titipan amplop via QRIS atau Transfer Bank Mempelai
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={giveEnvelope}
                    onChange={(e) => setGiveEnvelope(e.target.checked)}
                    className="w-4 h-4 accent-[#775a19] rounded cursor-pointer"
                  />
                </div>

                {giveEnvelope && (
                  <div className="p-3 space-y-3 bg-white border-t border-[#e4e1ea]">
                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEnvelopeMethod('qris')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border ${
                          envelopeMethod === 'qris'
                            ? 'bg-[#775a19] text-white border-[#775a19]'
                            : 'bg-[#f5f2fb] text-[#4e4639] border-[#e4e1ea]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">qr_code_2</span>
                        <span>QRIS Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEnvelopeMethod('transfer')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border ${
                          envelopeMethod === 'transfer'
                            ? 'bg-[#775a19] text-white border-[#775a19]'
                            : 'bg-[#f5f2fb] text-[#4e4639] border-[#e4e1ea]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">account_balance</span>
                        <span>Transfer Bank</span>
                      </button>
                    </div>

                    {/* QRIS Display or Bank Transfer Details */}
                    {envelopeMethod === 'qris' ? (
                      <div className="p-3 bg-[#f5f2fb] rounded-xl flex flex-col items-center text-center space-y-1.5 border border-[#e4e1ea]">
                        <div className="bg-white p-2 rounded-lg shadow-xs border border-gray-200">
                          <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=00020101021126580016ID.CO.QRIS.WWW0118936009988210988210214882109882190015204581253033605802ID5914KEVIN_CLARISSA6007JAKARTA6304E8A2"
                            alt="QRIS Wedding Kevin & Clarissa"
                            className="w-32 h-32 object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#1b1b21]">
                          QRIS Wedding Kevin &amp; Clarissa
                        </span>
                        <span className="text-[10px] text-[#7f7667]">
                          Bisa di-scan menggunakan GoPay, OVO, BCA Mobile, Livin Mandiri, atau Dana
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Rekening BCA */}
                        <div className="p-2.5 bg-[#f5f2fb] rounded-xl flex items-center justify-between border border-[#e4e1ea]">
                          <div>
                            <span className="text-[10px] font-bold text-[#775a19] block uppercase">
                              Bank Central Asia (BCA)
                            </span>
                            <span className="font-mono text-[13px] font-bold text-[#1b1b21]">
                              8821 0988 21
                            </span>
                            <span className="text-[10px] text-[#7f7667] block">a/n Kevin Pratama</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount('8821098821', 'BCA')}
                            className="px-2.5 py-1 bg-white border border-[#e4e1ea] hover:bg-[#efecf5] rounded-lg text-[11px] font-bold text-[#775a19] flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                            Salin
                          </button>
                        </div>

                        {/* Rekening Mandiri */}
                        <div className="p-2.5 bg-[#f5f2fb] rounded-xl flex items-center justify-between border border-[#e4e1ea]">
                          <div>
                            <span className="text-[10px] font-bold text-[#92484f] block uppercase">
                              Bank Mandiri
                            </span>
                            <span className="font-mono text-[13px] font-bold text-[#1b1b21]">
                              137 00 1928 333
                            </span>
                            <span className="text-[10px] text-[#7f7667] block">a/n Clarissa Wijaya</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount('137001928333', 'Mandiri')}
                            className="px-2.5 py-1 bg-white border border-[#e4e1ea] hover:bg-[#efecf5] rounded-lg text-[11px] font-bold text-[#92484f] flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                            Salin
                          </button>
                        </div>

                        {showCopyFeedback && (
                          <div className="text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded text-center font-semibold">
                            Nomor rekening {copiedBank} berhasil disalin!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nominal Selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11.5px] font-semibold text-[#1b1b21]">
                        Nominal Tanda Kasih (Rp)
                      </label>
                      <input
                        type="text"
                        value={nominal}
                        onChange={(e) => {
                          const raw = parseRupiah(e.target.value);
                          setNominal(raw === 0 ? '' : formatRupiah(raw));
                        }}
                        className="w-full px-3 py-1.5 bg-[#f5f2fb] rounded-lg border border-[#e4e1ea] text-[13px] font-bold text-[#775a19]"
                      />
                      <div className="flex items-center gap-1.5">
                        {[200000, 500000, 1000000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setNominal(formatRupiah(amt))}
                            className="text-[10.5px] bg-[#efecf5] hover:bg-[#e4e1ea] text-[#4e4639] font-semibold px-2 py-0.5 rounded"
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
              <div className="p-3 bg-[#f5f2fb] rounded-xl border border-[#e4e1ea] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-[#1b1b21]">
                  <input
                    type="checkbox"
                    checked={hasGift}
                    onChange={(e) => setHasGift(e.target.checked)}
                    className="w-4 h-4 accent-[#775a19] rounded"
                  />
                  <span>Membawa Bingkisan / Kado Fisik Langsung</span>
                </label>

                {hasGift && (
                  <input
                    type="text"
                    value={giftDescription}
                    onChange={(e) => setGiftDescription(e.target.value)}
                    placeholder="Contoh: Kado Peralatan Dapur / Tea Set"
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#e4e1ea] text-[12px]"
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#775a19] to-[#634b15] hover:from-[#634b15] hover:to-[#503b0f] text-white font-bold text-[13.5px] shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <span className="material-symbols-outlined text-[19px]">send</span>
                <span>Kirim RSVP &amp; Dapatkan Kupon Souvenir</span>
              </button>

              <p className="text-[10.5px] text-[#7f7667] text-center">
                Data akan otomatis tercatat ke buku resepsi meja tamu.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
