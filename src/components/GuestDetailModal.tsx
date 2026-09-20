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
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-[#1b1b21] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-[#e4e1ea]/70 flex flex-col max-h-[92vh]"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#c5a059] to-[#775a19] p-3.5 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#ffe088]">
              how_to_reg
            </span>
            <div>
              <span className="font-body text-[10px] tracking-widest uppercase text-white/80 block">
                Detail Kehadiran Tamu
              </span>
              <h3 className="font-headline text-[16px] font-semibold text-white leading-tight">
                {guest.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3 font-body text-[12.5px]">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2.5">
              <div>
                <label className="text-[11px] text-[#7f7667] font-bold block">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4e1ea] bg-[#f5f2fb] text-[13px] font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#7f7667] font-bold block">Asal / Relasi</label>
                <input
                  type="text"
                  value={editOrigin}
                  onChange={(e) => setEditOrigin(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4e1ea] bg-[#f5f2fb] text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#7f7667] font-bold block">Nominal Amplop (Rp)</label>
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4e1ea] bg-[#f5f2fb] text-[13px] font-bold text-[#775a19]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#7f7667] font-bold block">Metode Pembayaran</label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as EnvelopeMethod)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#e4e1ea] bg-[#f5f2fb] text-[12px]"
                  >
                    <option value="tunai">Tunai / Kotak</option>
                    <option value="qris">QRIS / Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#7f7667] font-bold block">Deskripsi Kado</label>
                  <input
                    type="text"
                    value={editGift}
                    onChange={(e) => setEditGift(e.target.value)}
                    placeholder="Kosongkan jika tidak ada"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4e1ea] bg-[#f5f2fb] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#7f7667] font-bold block">Nomor Rak Kado</label>
                  <input
                    type="text"
                    value={editShelf}
                    onChange={(e) => setEditShelf(e.target.value)}
                    placeholder="Contoh: K-42"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#e4e1ea] bg-[#f5f2fb] text-[12px]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#775a19] text-white rounded-lg font-bold text-[12px] shadow-xs"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 bg-[#eae7ef] text-[#1b1b21] rounded-lg text-[12px]"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Status Bar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f5f2fb] border border-[#e4e1ea]/60">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      guest.gender === 'wanita' ? 'bg-[#92484f]' : 'bg-slate-600'
                    }`}
                  ></span>
                  <span className="font-bold text-[#1b1b21]">
                    {guest.gender === 'wanita' ? 'Tamu Wanita' : 'Tamu Pria'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#ffdea5] text-[#261900] text-[10px] font-bold uppercase">
                    {guest.category}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-md bg-white hover:bg-[#eae7ef] text-[#775a19] border border-[#e4e1ea]"
                    title="Edit Tamu"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              </div>

              {/* Details list */}
              <div className="space-y-2">
                <div className="flex justify-between border-b border-[#efecf5] pb-1.5">
                  <span className="text-[#7f7667]">Asal / Relasi:</span>
                  <span className="font-semibold text-[#1b1b21]">{guest.origin}</span>
                </div>

                <div className="flex justify-between border-b border-[#efecf5] pb-1.5">
                  <span className="text-[#7f7667]">Waktu Check-In:</span>
                  <span className="font-semibold text-[#1b1b21]">{guest.time}</span>
                </div>

                <div className="flex justify-between border-b border-[#efecf5] pb-1.5">
                  <span className="text-[#7f7667]">Lokasi Petugas:</span>
                  <span className="font-semibold text-[#775a19]">{guest.checkedInBy}</span>
                </div>

                <div className="flex justify-between border-b border-[#efecf5] pb-1.5">
                  <span className="text-[#7f7667]">Titipan Amplop:</span>
                  <span className="font-bold text-[#775a19]">
                    {guest.hasEnvelope ? formatRupiah(guest.envelopeNominal) : 'Tidak ada'}
                    {guest.envelopeMethod ? ` (${guest.envelopeMethod.toUpperCase()})` : ''}
                  </span>
                </div>

                <div className="flex justify-between border-b border-[#efecf5] pb-1.5">
                  <span className="text-[#7f7667]">Kado Fisik:</span>
                  <span className="font-semibold text-[#92484f]">
                    {guest.hasGift ? guest.giftDescription || 'Souvenir' : 'Tidak ada'}
                    {guest.giftShelf ? ` • Rak ${guest.giftShelf}` : ''}
                  </span>
                </div>
              </div>

              {/* Doa & Ucapan */}
              {guest.prayerWish && (
                <div className="p-2.5 rounded-xl bg-[#f5f2fb] border border-[#e4e1ea]/60 space-y-1">
                  <span className="text-[10px] font-bold text-[#775a19] uppercase tracking-wider block">
                    Doa &amp; Ucapan Pengantin:
                  </span>
                  <p className="font-body text-[11.5px] italic text-[#4e4639] leading-relaxed">
                    "{guest.prayerWish}"
                  </p>
                </div>
              )}

              {/* Authentic Souvenir Token Voucher with Live Generated QR Code */}
              <div
                id="souvenir-slip"
                className="p-3 rounded-xl border border-dashed border-[#c5a059] bg-[#fffbf2] text-center space-y-2 relative"
              >
                <div className="text-[10px] text-[#7f7667] uppercase font-bold tracking-widest">
                  Kupon Souvenir &amp; Penukaran
                </div>

                {qrCodeUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Souvenir"
                      className="w-28 h-28 object-contain rounded p-1 bg-white border border-[#e4e1ea] shadow-xs"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 mx-auto bg-white border border-[#e4e1ea] rounded flex items-center justify-center text-xs text-gray-400">
                    Membuat QR...
                  </div>
                )}

                <div>
                  <p className="font-headline text-[14px] font-bold text-[#775a19]">
                    TOKEN: #SOUV-{guest.id.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-[#7f7667]">
                    Tunjukkan kupon ini ke booth souvenir di pintu keluar foyer.
                  </p>
                </div>
              </div>

              {/* Delete Guest Confirmation Section */}
              {showDeleteConfirm ? (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
                  <p className="text-[11.5px] text-red-800 font-semibold">
                    Yakin ingin menghapus catatan kehadiran tamu ini?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Hapus Sekarang
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-white text-gray-700 rounded-lg text-xs border border-gray-300"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    onClick={handleSendWhatsAppConfirmation}
                    className="text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    Kirim Kupon via WhatsApp
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Hapus Tamu
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#e4e1ea] bg-[#fbf8ff] grid grid-cols-2 gap-2">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 px-3 rounded-xl bg-[#efecf5] hover:bg-[#eae7ef] text-[#1b1b21] font-body text-[12px] font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-98"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Cetak Kupon</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-xl bg-[#775a19] text-white font-body text-[12px] font-bold flex items-center justify-center active:scale-98"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
