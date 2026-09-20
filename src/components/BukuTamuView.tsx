import React, { useState, useMemo, useRef } from 'react';
import { Guest } from '../types';
import { sound } from '../utils/sound';

interface BukuTamuViewProps {
  guests: Guest[];
  onAddGuestClick: () => void;
  onSelectGuest: (guest: Guest) => void;
  onOpenQRScan: () => void;
  onImportGuests?: (importedGuests: Guest[]) => void;
  onToggleVerified?: (guestId: string) => void;
}

export const BukuTamuView: React.FC<BukuTamuViewProps> = ({
  guests,
  onAddGuestClick,
  onSelectGuest,
  onOpenQRScan,
  onImportGuests,
  onToggleVerified,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pria' | 'wanita' | 'amplop' | 'kado'>('all');
  const [sortBy, setSortBy] = useState<'terbaru' | 'nominal' | 'nama'>('terbaru');
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalCount = guests.length;
    const priaCount = guests.filter((g) => g.gender === 'pria').length;
    const wanitaCount = guests.filter((g) => g.gender === 'wanita').length;
    const amplopCount = guests.filter((g) => g.hasEnvelope).length;
    const kadoCount = guests.filter((g) => g.hasGift).length;
    const totalNominal = guests.reduce((sum, g) => sum + (g.envelopeNominal || 0), 0);

    // Format nominal e.g. 84.5 Jt or 85.2 Jt
    const nominalInJuta = (totalNominal / 1000000).toFixed(1).replace('.', ',');
    const formattedNominal = `${nominalInJuta} Jt`;

    return {
      totalCount,
      priaCount,
      wanitaCount,
      amplopCount,
      kadoCount,
      formattedNominal,
    };
  }, [guests]);

  // Filtered and sorted guest list
  const filteredGuests = useMemo(() => {
    const list = guests.filter((guest) => {
      // Search check
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        guest.name.toLowerCase().includes(query) ||
        guest.origin.toLowerCase().includes(query) ||
        (guest.giftDescription && guest.giftDescription.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      // Filter category check
      if (filterType === 'pria') return guest.gender === 'pria';
      if (filterType === 'wanita') return guest.gender === 'wanita';
      if (filterType === 'amplop') return guest.hasEnvelope;
      if (filterType === 'kado') return guest.hasGift;
      return true;
    });

    // Sort check
    return list.sort((a, b) => {
      if (sortBy === 'nominal') {
        return (b.envelopeNominal || 0) - (a.envelopeNominal || 0);
      }
      if (sortBy === 'nama') {
        return a.name.localeCompare(b.name);
      }
      // 'terbaru' (default)
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [guests, searchQuery, filterType, sortBy]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const newImported: Guest[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/(^"|"$)/g, '').trim());
        if (parts.length >= 2 && parts[1]) {
          const name = parts[1];
          const genderRaw = (parts[2] || '').toLowerCase();
          const gender = genderRaw.startsWith('p') || genderRaw.startsWith('w') ? 'wanita' : 'pria';
          const origin = parts[3] || 'Jakarta';
          const nominal = parseInt(parts[5] || '0', 10) || 0;
          const gift = parts[7] || '';
          const shelf = parts[8] || '';

          newImported.push({
            id: `g-imp-${Date.now()}-${i}`,
            name,
            gender,
            origin,
            category: 'Reguler',
            time: '19:00 WIB',
            timestamp: Date.now() - i * 60000,
            hasEnvelope: nominal > 0,
            envelopeNominal: nominal > 0 ? nominal : undefined,
            envelopeMethod: nominal > 0 ? 'tunai' : undefined,
            hasGift: gift.length > 0,
            giftDescription: gift.length > 0 ? gift : undefined,
            giftShelf: shelf.length > 0 ? shelf : undefined,
            checkedInBy: 'Impor CSV',
            isVerified: true,
          });
        }
      }

      if (newImported.length > 0 && onImportGuests) {
        onImportGuests(newImported);
        sound.playCheckInChime();
        setImportNotification(`Berhasil mengimpor ${newImported.length} tamu dari file CSV.`);
        setTimeout(() => setImportNotification(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-4 gap-3.5 pb-28">
      {/* Hidden CSV input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleCSVUpload}
      />

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="p-3 bg-[#e9c176] text-[#261900] rounded-xl text-xs font-bold flex items-center justify-between shadow-md">
          <span>{importNotification}</span>
          <button onClick={() => setImportNotification(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Live Status & Event Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#f5f2fb] p-3.5 shadow-sm border border-[#e4e1ea]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#92484f] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#92484f]"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[11px] font-bold text-[#92484f] uppercase tracking-wider">
                Live Reception Log
              </span>
              <span className="font-headline text-[15px] sm:text-[16px] font-semibold text-[#1b1b21] truncate">
                Grand Ballroom Hotel Mulia
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e4e1ea]/70 shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[14px] text-[#775a19] fill-1">
              cloud_done
            </span>
            <span className="font-body text-[11px] font-semibold text-[#775a19]">
              Firebase Sync
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Card 1: Total Tamu */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white shadow-sm border border-[#e4e1ea]/50">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#775a19] text-xl">groups</span>
            <span className="font-body text-[10px] font-bold text-[#775a19] bg-[#ffdea5] px-1.5 py-0.5 rounded-full">
              +4 baru
            </span>
          </div>
          <div className="mt-2">
            <span className="font-headline text-[20px] font-bold text-[#1b1b21] block leading-tight">
              {stats.totalCount}
            </span>
            <span className="font-body text-[11px] text-[#7f7667] truncate block mt-0.5">
              Tamu Hadir
            </span>
          </div>
        </div>

        {/* Card 2: Total Amplop */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white shadow-sm border border-[#e4e1ea]/50">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#735c00] text-xl">payments</span>
            <span className="font-body text-[10px] font-bold text-[#241a00] bg-[#ffe088] px-1.5 py-0.5 rounded-full">
              {stats.amplopCount} T
            </span>
          </div>
          <div className="mt-2">
            <span className="font-headline text-[20px] font-bold text-[#1b1b21] block leading-tight">
              {stats.formattedNominal}
            </span>
            <span className="font-body text-[11px] text-[#7f7667] truncate block mt-0.5">
              Total Amplop
            </span>
          </div>
        </div>

        {/* Card 3: Total Kado */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-white shadow-sm border border-[#e4e1ea]/50">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-[#92484f] text-xl">
              featured_seasonal_and_gifts
            </span>
            <span className="font-body text-[10px] font-bold text-[#3c0610] bg-[#ffdadb] px-1.5 py-0.5 rounded-full">
              {stats.kadoCount} Pkt
            </span>
          </div>
          <div className="mt-2">
            <span className="font-headline text-[20px] font-bold text-[#1b1b21] block leading-tight">
              {stats.kadoCount}
            </span>
            <span className="font-body text-[11px] text-[#7f7667] truncate block mt-0.5">
              Kado Fisik
            </span>
          </div>
        </div>
      </div>

      {/* Search, Sort, and Import Bar */}
      <div className="flex flex-col gap-2">
        {/* Search Bar */}
        <div className="relative w-full flex items-center bg-white rounded-xl px-3.5 py-2 shadow-sm border border-[#e4e1ea]/60 focus-within:ring-2 focus-within:ring-[#775a19]/40 transition-all">
          <span className="material-symbols-outlined text-[#7f7667] mr-2 text-xl shrink-0">
            search
          </span>
          <input
            className="w-full bg-transparent font-body text-[13.5px] text-[#1b1b21] placeholder:text-[#7f7667]/80 focus:outline-none"
            placeholder="Cari nama tamu, asal, atau kado..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#7f7667] hover:text-[#1b1b21] mr-1 p-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button
            onClick={onOpenQRScan}
            aria-label="Tampilkan QR Meja Tamu / Scan QR Undangan"
            title="Tampilkan QR Meja Tamu (RSVP) & Scan"
            className="shrink-0 p-1.5 rounded-lg bg-[#ffdea5] text-[#261900] hover:bg-[#775a19] hover:text-white transition-colors active:scale-95 shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px] block">qr_code_2</span>
          </button>
        </div>

        {/* Filter Chips & Sorting Control */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                sound.playTap();
                setFilterType('all');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'all'
                  ? 'bg-[#775a19] text-white shadow-sm'
                  : 'bg-white text-[#4e4639] hover:bg-[#efecf5] border border-[#e4e1ea]/60'
              }`}
            >
              <span>Semua</span>
              <span className={filterType === 'all' ? 'text-[#ffdea5]' : 'text-[#7f7667]'}>
                ({stats.totalCount})
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setFilterType('pria');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'pria'
                  ? 'bg-[#775a19] text-white shadow-sm'
                  : 'bg-white text-[#4e4639] hover:bg-[#efecf5] border border-[#e4e1ea]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">male</span>
              <span>Pria</span>
              <span className={filterType === 'pria' ? 'text-[#ffdea5]' : 'text-[#7f7667]'}>
                ({stats.priaCount})
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setFilterType('wanita');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'wanita'
                  ? 'bg-[#92484f] text-white shadow-sm'
                  : 'bg-white text-[#4e4639] hover:bg-[#efecf5] border border-[#e4e1ea]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">female</span>
              <span>Wanita</span>
              <span className={filterType === 'wanita' ? 'text-[#ffdadb]' : 'text-[#7f7667]'}>
                ({stats.wanitaCount})
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setFilterType('amplop');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'amplop'
                  ? 'bg-[#735c00] text-white shadow-sm'
                  : 'bg-white text-[#4e4639] hover:bg-[#efecf5] border border-[#e4e1ea]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">mail</span>
              <span>Amplop</span>
              <span className={filterType === 'amplop' ? 'text-[#ffe088]' : 'text-[#7f7667]'}>
                ({stats.amplopCount})
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setFilterType('kado');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'kado'
                  ? 'bg-[#92484f] text-white shadow-sm'
                  : 'bg-white text-[#4e4639] hover:bg-[#efecf5] border border-[#e4e1ea]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">redeem</span>
              <span>Kado</span>
              <span className={filterType === 'kado' ? 'text-[#ffdadb]' : 'text-[#7f7667]'}>
                ({stats.kadoCount})
              </span>
            </button>
          </div>

          {/* Quick Sort dropdown */}
          <div className="flex items-center shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'terbaru' | 'nominal' | 'nama')}
              className="text-[11px] font-semibold px-2 py-1.5 bg-white rounded-lg border border-[#e4e1ea] text-[#4e4639] outline-none"
            >
              <option value="terbaru">Terbaru</option>
              <option value="nominal">Nominal Tertinggi</option>
              <option value="nama">Nama A-Z</option>
            </select>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between text-[11px] px-1 text-[#7f7667]">
          <span>Menampilkan {filteredGuests.length} dari {guests.length} tamu</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTap();
                onAddGuestClick();
              }}
              className="text-[#775a19] font-bold hover:underline flex items-center gap-1 bg-[#ffdea5]/50 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              + Tambah Tamu
            </button>
            <button
              onClick={onOpenQRScan}
              className="text-[#775a19] font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
              QR Meja
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#4e4639] hover:text-[#775a19] font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Guest Cards List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-body text-[12px] font-bold text-[#1b1b21] uppercase tracking-wider">
            Catatan Tamu Terkini
          </span>
          <span className="font-body text-[11px] text-[#7f7667]">
            Ketuk kartu untuk detail &amp; kupon
          </span>
        </div>

        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-[#e4e1ea] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#ffdea5]/40 text-[#775a19] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">menu_book</span>
            </div>
            <p className="font-headline text-[15px] font-bold text-[#1b1b21]">
              Buku Tamu Masih Kosong
            </p>
            <p className="font-body text-[12px] text-[#7f7667] max-w-xs">
              Mulai catat tamu yang hadir di resepsi pernikahan Anda sekarang.
            </p>
            <button
              onClick={() => {
                sound.playTap();
                onAddGuestClick();
              }}
              className="px-4 py-2.5 bg-[#775a19] hover:bg-[#634b15] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ Tambah Tamu Sekarang</span>
            </button>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-[#e4e1ea] text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-[#7f7667]">
              person_search
            </span>
            <p className="font-body text-[13px] font-semibold text-[#1b1b21]">
              Tidak ada tamu yang sesuai filter
            </p>
            <p className="font-body text-[11px] text-[#7f7667]">
              Coba gunakan kata kunci pencarian lain atau reset filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-3 py-1.5 bg-[#775a19] text-white rounded-lg text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredGuests.map((guest) => {
            const isMale = guest.gender === 'pria';

            return (
              <div
                key={guest.id}
                onClick={() => onSelectGuest(guest)}
                className="flex flex-col p-3 rounded-xl bg-white shadow-xs border border-[#e4e1ea]/70 hover:border-[#c5a059] active:scale-[0.99] transition-all cursor-pointer gap-2"
              >
                {/* Card Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isMale ? 'bg-[#ffdea5] text-[#261900]' : 'bg-[#ffdadb] text-[#3c0610]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isMale ? 'man' : 'woman'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-body text-[13.5px] font-bold text-[#1b1b21] truncate">
                          {guest.name}
                        </span>
                        {guest.category && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              guest.category === 'VIP'
                                ? 'bg-amber-100 text-amber-800'
                                : guest.category === 'Keluarga'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {guest.category}
                          </span>
                        )}
                      </div>
                      <span className="font-body text-[11px] text-[#7f7667] truncate">
                        {guest.origin} • {guest.time}
                      </span>
                    </div>
                  </div>

                  {/* Verification pill toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleVerified) onToggleVerified(guest.id);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
                      guest.isVerified
                        ? 'bg-[#eae7ef] text-[#775a19]'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px] fill-1">
                      {guest.isVerified ? 'verified' : 'radio_button_unchecked'}
                    </span>
                    <span>{guest.isVerified ? 'Terverifikasi' : 'Menunggu'}</span>
                  </button>
                </div>

                {/* Card Tags & Details Row */}
                <div className="flex items-center justify-between border-t border-[#efecf5] pt-2 font-body text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {guest.hasEnvelope && guest.envelopeNominal ? (
                      <span className="inline-flex items-center gap-1 text-[#775a19] font-bold bg-[#ffdea5]/50 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">payments</span>
                        <span>Rp {formatRupiah(guest.envelopeNominal)}</span>
                        {guest.envelopeMethod === 'qris' && (
                          <span className="text-[9px] font-normal uppercase bg-white px-1 rounded">
                            QRIS
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#7f7667] text-[10.5px]">Tanpa amplop</span>
                    )}

                    {guest.hasGift && (
                      <span className="inline-flex items-center gap-1 text-[#92484f] font-semibold bg-[#ffdadb]/50 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">redeem</span>
                        <span className="truncate max-w-[120px]">
                          {guest.giftDescription || 'Souvenir'}
                        </span>
                        {guest.giftShelf && (
                          <span className="font-bold">({guest.giftShelf})</span>
                        )}
                      </span>
                    )}
                  </div>

                  <span className="material-symbols-outlined text-[#7f7667] text-base">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) - Dikunci persis di dalam batas frame aplikasi */}
      <div className="fixed bottom-20 inset-x-0 z-40 pointer-events-none">
        <div className="w-full max-w-md mx-auto px-4 flex justify-end">
          <button
            onClick={() => {
              sound.playTap();
              onAddGuestClick();
            }}
            className="pointer-events-auto flex items-center gap-2 py-3 px-4 rounded-full bg-[#775a19] hover:bg-[#634b15] text-white shadow-xl active:scale-95 transition-all font-body text-[12.5px] font-bold border border-[#ffdea5]/30 hover:shadow-2xl"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span>+ Tambah Tamu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
