import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Guest, EnvelopeMethod } from '../types';
import { sound } from '../utils/sound';

interface GuestDetailModalProps {
  guest: Guest | null;
  onClose: () => void;
  onUpdateGuest?: (updated: Guest) => void;
  onDeleteGuest?: (guestId: string) => void;
}

export const GuestDetailModal: React.FC<GuestDetailModalProps> = ({
  guest,
  onClose,
  onUpdateGuest,
  onDeleteGuest,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOrigin, setEditOrigin] = useState('');
  const [editNominal, setEditNominal] = useState(0);
  const [editMethod, setEditMethod] = useState<EnvelopeMethod>('tunai');
  const [editGift, setEditGift] = useState('');
  const [editShelf, setEditShelf] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (guest) {
      setEditName(guest.name);
      setEditOrigin(guest.origin);
      setEditNominal(guest.envelopeNominal || 0);
      setEditMethod(guest.envelopeMethod || 'tunai');
      setEditGift(guest.giftDescription || '');
      setEditShelf(guest.giftShelf || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);

      // Generate real QR code image for the souvenir voucher
      const payload = JSON.stringify({
        token: `SOUV-${guest.id}`,
        name: guest.name,
        venue: 'Grand Ballroom Mulia',
        event: 'The Wedding of Kevin & Clarissa',
        checkin: guest.time,
      });

      QRCode.toDataURL(payload, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1b1b21',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [guest]);

  if (!guest) return null;

  const formatRupiah = (num?: number) => {
    if (!num) return '-';
    return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
  };

  const handlePrint = () => {
    sound.playTap();
    window.print();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateGuest) return;

    const updated: Guest = {
      ...guest,
      name: editName.trim() || guest.name,
      origin: editOrigin.trim() || guest.origin,
      hasEnvelope: editNominal > 0,
      envelopeNominal: editNominal > 0 ? editNominal : undefined,
      envelopeMethod: editNominal > 0 ? editMethod : undefined,
      hasGift: editGift.trim().length > 0,
      giftDescription: editGift.trim() || undefined,
      giftShelf: editShelf.trim() || undefined,
    };

    onUpdateGuest(updated);
    setIsEditing(false);
    sound.playTap();
  };

  const handleDelete = () => {
    if (onDeleteGuest) {
      onDeleteGuest(guest.id);
      sound.playTap();
      onClose();
    }
  };

  const handleSendWhatsAppConfirmation = () => {
    sound.playTap();
    const message = `Halo Bpk/Ibu *${guest.name}*,\n\nTerima kasih atas kehadiran dan doa restu Anda di *The Wedding of Kevin & Clarissa* (Grand Ballroom Hotel Mulia).\n\nNomor Kupon Souvenir Anda: *#SOUV-${guest.id.toUpperCase()}*\nSilakan tunjukkan pesan ini ke meja souvenir saat hendak berpamitan.\n\nSalam hangat,\nKevin & Clarissa`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card bg-white/95 text-stone-900 w-full max-w-lg md:max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-orange-200/80 flex flex-col max-h-[90vh]"
      >
        {/* Header Ribbon with Orange Gradient */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl text-white">
                how_to_reg
              </span>
            </div>
            <div>
              <span className="font-body text-[10px] sm:text-[11px] tracking-widest uppercase text-white/90 font-bold block">
                Detail Kehadiran Tamu
              </span>
              <h3 className="font-headline text-base sm:text-lg font-bold text-white leading-tight">
                {guest.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto font-body text-xs sm:text-sm">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 font-bold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 font-bold block mb-1">Asal / Relasi</label>
                <input
                  type="text"
                  value={editOrigin}
                  onChange={(e) => setEditOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-600 font-bold block mb-1">Nominal Amplop (Rp)</label>
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm font-bold text-orange-700 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 font-bold block mb-1">Metode Pembayaran</label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as EnvelopeMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="tunai">Tunai / Kotak</option>
                    <option value="qris">QRIS / Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-600 font-bold block mb-1">Deskripsi Kado</label>
                  <input
                    type="text"
                    value={editGift}
                    onChange={(e) => setEditGift(e.target.value)}
                    placeholder="Kosongkan jika tidak ada"
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 font-bold block mb-1">Nomor Rak Kado</label>
                  <input
                    type="text"
                    value={editShelf}
                    onChange={(e) => setEditShelf(e.target.value)}
                    placeholder="Contoh: K-42"
                    className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-orange-50/50 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column on Desktop: Info & Wishes (md:col-span-7) */}
              <div className="md:col-span-7 space-y-3.5">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/80 border border-orange-200/70">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        guest.gender === 'wanita' ? 'bg-rose-500' : 'bg-sky-600'
                      }`}
                    ></span>
                    <span className="font-bold text-stone-900">
                      {guest.gender === 'wanita' ? 'Tamu Wanita' : 'Tamu Pria'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[11px] font-bold uppercase tracking-wider border border-orange-200">
                      {guest.category}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded-lg bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 shadow-xs transition-colors"
                      title="Edit Tamu"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 bg-white/70 rounded-xl p-3 border border-orange-100 shadow-xs">
                  <div className="flex justify-between border-b border-orange-100 pb-2">
                    <span className="text-stone-500">Asal / Relasi:</span>
                    <span className="font-semibold text-stone-900">{guest.origin}</span>
                  </div>

                  <div className="flex justify-between border-b border-orange-100 pb-2">
                    <span className="text-stone-500">Waktu Check-In:</span>
                    <span className="font-semibold text-stone-900">{guest.time}</span>
                  </div>

                  <div className="flex justify-between border-b border-orange-100 pb-2">
                    <span className="text-stone-500">Lokasi Petugas:</span>
                    <span className="font-semibold text-orange-700">{guest.checkedInBy}</span>
                  </div>

                  <div className="flex justify-between border-b border-orange-100 pb-2">
                    <span className="text-stone-500">Titipan Amplop:</span>
                    <span className="font-bold text-orange-700">
                      {guest.hasEnvelope ? formatRupiah(guest.envelopeNominal) : 'Tidak ada'}
                      {guest.envelopeMethod ? ` (${guest.envelopeMethod.toUpperCase()})` : ''}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Kado Fisik:</span>
                    <span className="font-semibold text-rose-800">
                      {guest.hasGift ? guest.giftDescription || 'Souvenir' : 'Tidak ada'}
                      {guest.giftShelf ? ` • Rak ${guest.giftShelf}` : ''}
                    </span>
                  </div>
                </div>

                {/* Doa & Ucapan */}
                {guest.prayerWish && (
                  <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/60 space-y-1">
                    <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                      Doa &amp; Ucapan Pengantin:
                    </span>
                    <p className="font-body text-xs italic text-stone-700 leading-relaxed">
                      "{guest.prayerWish}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column on Desktop: Souvenir Coupon & Actions (md:col-span-5) */}
              <div className="md:col-span-5 space-y-3">
                {/* Authentic Souvenir Token Voucher with Live Generated QR Code */}
                <div
                  id="souvenir-slip"
                  className="p-3.5 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 text-center space-y-2.5 shadow-xs"
                >
                  <div className="text-[11px] text-orange-800 uppercase font-bold tracking-wider">
                    Kupon Souvenir &amp; Penukaran
                  </div>

                  {qrCodeUrl ? (
                    <div className="flex justify-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR Souvenir"
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl p-1.5 bg-white border border-orange-200 shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto bg-white border border-orange-200 rounded-xl flex items-center justify-center text-xs text-stone-400">
                      Membuat QR...
                    </div>
                  )}

                  <div>
                    <p className="font-headline text-sm font-bold text-orange-700">
                      TOKEN: #SOUV-{guest.id.toUpperCase()}
                    </p>
                    <p className="text-[10.5px] text-stone-500 leading-tight mt-0.5">
                      Tunjukkan kupon ini ke booth souvenir di pintu keluar foyer.
                    </p>
                  </div>
                </div>

                {/* Delete Guest Confirmation Section */}
                {showDeleteConfirm ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-2">
                    <p className="text-xs text-rose-800 font-semibold">
                      Yakin ingin menghapus catatan kehadiran tamu ini?
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95"
                      >
                        Hapus Sekarang
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 bg-white text-stone-700 rounded-lg text-xs border border-stone-200 hover:bg-stone-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={handleSendWhatsAppConfirmation}
                      className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                      WhatsApp Kupon
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-rose-600 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-orange-200/60 bg-orange-50/40 grid grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-orange-50 text-stone-900 border border-orange-200 font-body text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-98 shadow-xs"
          >
            <span className="material-symbols-outlined text-base text-orange-600">print</span>
            <span>Cetak Kupon</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-body text-xs sm:text-sm font-bold flex items-center justify-center active:scale-98 shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
