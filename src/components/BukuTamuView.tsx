import React, { useState, useMemo, useRef } from 'react';
import { Guest } from '../types';
import { sound } from '../utils/sound';

interface BukuTamuViewProps {
  guests: Guest[];
  onAddGuestClick: () => void;
  onSelectGuest: (guest: Guest) => void;
  onOpenQRScan: () => void;
  onOpenRSVP?: () => void;
  onImportGuests?: (importedGuests: Guest[]) => void;
  onToggleVerified?: (guestId: string) => void;
}

export const BukuTamuView: React.FC<BukuTamuViewProps> = ({
  guests,
  onAddGuestClick,
  onSelectGuest,
  onOpenQRScan,
  onOpenRSVP,
  onImportGuests,
  onToggleVerified,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'pria' | 'wanita' | 'amplop' | 'kado' | 'rsvp' | 'resepsionis'
  >('all');
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
    const rsvpCount = guests.filter((g) => g.isRsvp || g.checkedInBy?.includes('RSVP')).length;
    const deskCount = guests.filter((g) => !g.isRsvp && !g.checkedInBy?.includes('RSVP')).length;
    const totalPax = guests.reduce((sum, g) => sum + (g.paxCount || 1), 0);
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
      rsvpCount,
      deskCount,
      totalPax,
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
      if (filterType === 'rsvp') return Boolean(guest.isRsvp || guest.checkedInBy?.includes('RSVP'));
      if (filterType === 'resepsionis') return !guest.isRsvp && !guest.checkedInBy?.includes('RSVP');
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
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-6 pb-28 md:pb-16">
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
      <div className="relative overflow-hidden rounded-2xl glass-panel p-4 sm:p-5 shadow-sm border border-white/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-600"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[11px] sm:text-[12px] font-bold text-orange-600 uppercase tracking-wider">
                Live Reception Workstation • Meja Resepsi
              </span>
              <span className="font-headline text-[16px] sm:text-[18px] lg:text-[20px] font-bold text-stone-900 truncate">
                Grand Ballroom Hotel Mulia, Jakarta
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100/70 border border-orange-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-orange-700 fill-1">
                cloud_done
              </span>
              <span className="font-body text-[11.5px] font-bold text-orange-800">
                Firestore Cloud Active
              </span>
            </div>
            <button
              onClick={onOpenQRScan}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-orange-200 text-orange-800 text-[11.5px] font-bold hover:bg-orange-50 transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
              <span>QR Mandiri</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
        {/* Card 1: Total Tamu */}
        <div className="flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl glass-card border border-white/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-orange-600 text-2xl sm:text-3xl">groups</span>
            <span className="font-body text-[10px] sm:text-[11px] font-bold text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200/50">
              Hadir ({stats.totalPax} Pax)
            </span>
          </div>
          <div className="mt-3">
            <span className="font-headline text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-stone-900 block leading-tight">
              {stats.totalCount}
            </span>
            <span className="font-body text-[11.5px] sm:text-[13px] text-orange-950/70 truncate block mt-0.5 font-medium">
              Total Tamu Hadir
            </span>
          </div>
        </div>

        {/* Card 2: Total Amplop */}
        <div className="flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl glass-card border border-white/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-amber-600 text-2xl sm:text-3xl">payments</span>
            <span className="font-body text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/50">
              {stats.amplopCount} Amplop
            </span>
          </div>
          <div className="mt-3">
            <span className="font-headline text-[20px] sm:text-[26px] lg:text-[30px] font-bold text-stone-900 block leading-tight truncate">
              {stats.formattedNominal}
            </span>
            <span className="font-body text-[11.5px] sm:text-[13px] text-orange-950/70 truncate block mt-0.5 font-medium">
              Total Titipan Amplop
            </span>
          </div>
        </div>

        {/* Card 3: Total Kado */}
        <div className="flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl glass-card border border-white/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-orange-500 text-2xl sm:text-3xl">
              featured_seasonal_and_gifts
            </span>
            <span className="font-body text-[10px] sm:text-[11px] font-bold text-orange-900 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200/50">
              {stats.kadoCount} Paket
            </span>
          </div>
          <div className="mt-3">
            <span className="font-headline text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-stone-900 block leading-tight">
              {stats.kadoCount}
            </span>
            <span className="font-body text-[11.5px] sm:text-[13px] text-orange-950/70 truncate block mt-0.5 font-medium">
              Kado Fisik Diterima
            </span>
          </div>
        </div>
      </div>

      {/* Search, Sort, and Import Bar */}
      <div className="flex flex-col gap-2">
        {/* Search Bar */}
        <div className="relative w-full flex items-center glass-input rounded-2xl px-3.5 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/30 transition-all">
          <span className="material-symbols-outlined text-orange-500 mr-2 text-xl shrink-0">
            search
          </span>
          <input
            className="w-full bg-transparent font-body text-[13.5px] text-stone-900 placeholder:text-stone-400 focus:outline-none"
            placeholder="Cari nama tamu, asal, atau kado..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-stone-400 hover:text-stone-700 mr-1 p-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button
            onClick={onOpenQRScan}
            aria-label="Tampilkan QR Meja Tamu / Scan QR Undangan"
            title="Tampilkan QR Meja Tamu (RSVP) & Scan"
            className="shrink-0 p-1.5 rounded-xl btn-citrus-primary active:scale-95 shadow-xs"
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
                  ? 'btn-citrus-primary shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span>Semua</span>
              <span className={filterType === 'all' ? 'text-orange-100' : 'text-stone-400'}>
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
                  ? 'btn-citrus-primary shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">male</span>
              <span>Pria</span>
              <span className={filterType === 'pria' ? 'text-orange-100' : 'text-stone-400'}>
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
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">female</span>
              <span>Wanita</span>
              <span className={filterType === 'wanita' ? 'text-rose-100' : 'text-stone-400'}>
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
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">mail</span>
              <span>Amplop</span>
              <span className={filterType === 'amplop' ? 'text-amber-100' : 'text-stone-400'}>
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
                  ? 'btn-citrus-primary shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">redeem</span>
              <span>Kado</span>
              <span className={filterType === 'kado' ? 'text-orange-100' : 'text-stone-400'}>
                ({stats.kadoCount})
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setFilterType('rsvp');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'rsvp'
                  ? 'bg-gradient-to-r from-indigo-600 to-orange-600 text-white shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
              <span>RSVP</span>
              <span className={filterType === 'rsvp' ? 'text-indigo-100' : 'text-stone-400'}>
                ({stats.rsvpCount})
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setFilterType('resepsionis');
              }}
              className={`px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold transition-all flex items-center gap-1 ${
                filterType === 'resepsionis'
                  ? 'btn-citrus-primary shadow-xs'
                  : 'bg-white/80 backdrop-blur-md text-stone-700 hover:bg-orange-50/60 border border-orange-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">desk</span>
              <span>Meja Resepsi</span>
              <span className={filterType === 'resepsionis' ? 'text-orange-100' : 'text-stone-400'}>
                ({stats.deskCount})
              </span>
            </button>
          </div>

          {/* Quick Sort dropdown */}
          <div className="flex items-center shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'terbaru' | 'nominal' | 'nama')}
              className="text-[11px] font-semibold px-2 py-1.5 bg-white/90 rounded-xl border border-orange-200/80 text-orange-950 outline-none shadow-2xs"
            >
              <option value="terbaru">Terbaru</option>
              <option value="nominal">Nominal Tertinggi</option>
              <option value="nama">Nama A-Z</option>
            </select>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between text-[11px] px-1 text-stone-600 flex-wrap gap-2">
          <span>
            {filteredGuests.length} dari {guests.length} tamu ({stats.totalPax} Pax)
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                sound.playTap();
                onAddGuestClick();
              }}
              className="text-orange-700 font-bold hover:underline flex items-center gap-1 bg-orange-100/80 border border-orange-200/60 px-2.5 py-1 rounded-xl text-[11px] transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              + Meja Resepsi
            </button>
            {onOpenRSVP && (
              <button
                onClick={() => {
                  sound.playTap();
                  onOpenRSVP();
                }}
                className="text-orange-700 font-bold hover:underline flex items-center gap-1 bg-white/80 border border-orange-200 px-2.5 py-1 rounded-xl text-[11px] transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                + Form RSVP
              </button>
            )}
            <button
              onClick={onOpenQRScan}
              className="text-orange-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
              QR Meja
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-orange-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Guest Table Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-1">
          <div>
            <h2 className="font-headline text-[15px] sm:text-[17px] font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 text-xl">table_chart</span>
              Tabel Catatan Tamu Digital
            </h2>
            <p className="font-body text-[11.5px] text-stone-500">
              Format tabel resmi buku tamu dengan rincian kehadiran, amplop, kado, dan status verifikasi
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 bg-white/90 border border-orange-200/70 px-2.5 py-1 rounded-lg font-medium text-orange-950 shadow-2xs">
              <span className="material-symbols-outlined text-[14px] text-orange-600">touch_app</span>
              Klik baris untuk detail &amp; kupon
            </span>
          </div>
        </div>

        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-[#e4e1ea] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#ffdea5]/40 text-[#775a19] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-orange-600">menu_book</span>
            </div>
            <p className="font-headline text-[15px] font-bold text-stone-900">
              Buku Tamu Masih Kosong
            </p>
            <p className="font-body text-[12px] text-stone-500 max-w-xs">
              Mulai catat tamu yang hadir di resepsi pernikahan Anda sekarang.
            </p>
            <button
              onClick={() => {
                sound.playTap();
                onAddGuestClick();
              }}
              className="px-4 py-2.5 btn-citrus-primary rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ Tambah Tamu Sekarang</span>
            </button>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 glass-card rounded-2xl border border-dashed border-orange-200 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-orange-400">
              person_search
            </span>
            <p className="font-body text-[13px] font-semibold text-stone-900">
              Tidak ada tamu yang sesuai filter
            </p>
            <p className="font-body text-[11px] text-stone-500">
              Coba gunakan kata kunci pencarian lain atau reset filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-3 py-1.5 btn-citrus-primary rounded-xl text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/90 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px] md:min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border-b border-orange-200/80 text-[11px] font-bold text-orange-950 uppercase tracking-wider">
                    <th scope="col" className="py-3 px-3.5 text-center w-12">
                      No
                    </th>
                    <th scope="col" className="py-3 px-3.5">
                      Nama &amp; Profil Tamu
                    </th>
                    <th scope="col" className="py-3 px-3 text-center">
                      Waktu &amp; Asal
                    </th>
                    <th scope="col" className="py-3 px-3 text-center">
                      Metode Masuk
                    </th>
                    <th scope="col" className="py-3 px-3 text-right">
                      Titipan Amplop
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Kado / Souvenir
                    </th>
                    <th scope="col" className="py-3 px-3 text-center">
                      Verifikasi
                    </th>
                    <th scope="col" className="py-3 px-3.5 text-center w-24">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/70 font-body text-[12.5px] text-stone-800">
                  {filteredGuests.map((guest, idx) => {
                    const isMale = guest.gender === 'pria';
                    return (
                      <tr
                        key={guest.id}
                        onClick={() => onSelectGuest(guest)}
                        className="hover:bg-orange-50/70 active:bg-orange-100/50 transition-colors cursor-pointer group"
                      >
                        {/* No & Gender Icon */}
                        <td className="py-3 px-3.5 text-center font-bold text-stone-400 group-hover:text-orange-700">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-[12px]">{idx + 1}</span>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                                isMale
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                              title={isMale ? 'Pria' : 'Wanita'}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {isMale ? 'man' : 'woman'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Nama Tamu & Kategori */}
                        <td className="py-3 px-3.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-stone-900 group-hover:text-orange-950 transition-colors">
                                {guest.name}
                              </span>
                              {guest.category && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    guest.category === 'VIP'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : guest.category === 'Keluarga'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {guest.category}
                                </span>
                              )}
                              {guest.paxCount && guest.paxCount > 1 ? (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {guest.paxCount} Pax
                                </span>
                              ) : null}
                            </div>
                            {guest.phone && (
                              <span className="text-[11px] text-stone-400 mt-0.5">
                                Tel: {guest.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Waktu & Asal */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-stone-800 text-[12px]">
                              {guest.time}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate max-w-[120px]">
                              {guest.origin}
                            </span>
                          </div>
                        </td>

                        {/* Metode Masuk */}
                        <td className="py-3 px-3 text-center">
                          {guest.isRsvp || guest.checkedInBy?.includes('RSVP') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <span className="material-symbols-outlined text-[13px]">
                                how_to_reg
                              </span>
                              RSVP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-50 text-orange-700 border border-orange-200/70">
                              <span className="material-symbols-outlined text-[13px]">desk</span>
                              Resepsi
                            </span>
                          )}
                        </td>

                        {/* Titipan Amplop */}
                        <td className="py-3 px-3 text-right">
                          {guest.hasEnvelope && guest.envelopeNominal ? (
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-orange-800 text-[12.5px]">
                                Rp {formatRupiah(guest.envelopeNominal)}
                              </span>
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-orange-100/80 text-orange-900 border border-orange-200/50 mt-0.5">
                                {guest.envelopeMethod === 'qris' ? 'QRIS Digital' : 'Tunai'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 text-[11px] italic">-</span>
                          )}
                        </td>

                        {/* Kado / Souvenir */}
                        <td className="py-3 px-3">
                          {guest.hasGift ? (
                            <div className="inline-flex items-center gap-1 text-[11.5px] text-amber-900 bg-amber-50/80 border border-amber-200/60 px-2 py-1 rounded-lg">
                              <span className="material-symbols-outlined text-[14px] text-amber-600 shrink-0">
                                redeem
                              </span>
                              <span className="font-medium truncate max-w-[130px]">
                                {guest.giftDescription || 'Kado Fisik'}
                              </span>
                              {guest.giftShelf && (
                                <span className="text-[10px] font-bold text-amber-800 shrink-0 bg-amber-100 px-1 rounded">
                                  {guest.giftShelf}
                                </span>
                              )}
                            </div>
                          ) : guest.souvenirTaken ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                              <span className="material-symbols-outlined text-[13px]">
                                check_circle
                              </span>
                              Souvenir
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[11px] italic">-</span>
                          )}
                        </td>

                        {/* Status Verifikasi */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleVerified) onToggleVerified(guest.id);
                            }}
                            title="Klik untuk mengubah status verifikasi"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all ${
                              guest.isVerified
                                ? 'bg-orange-100/90 text-orange-800 border border-orange-300/70 hover:bg-orange-200/70'
                                : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200/60'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px] fill-1">
                              {guest.isVerified ? 'verified' : 'radio_button_unchecked'}
                            </span>
                            <span>{guest.isVerified ? 'Valid' : 'Menunggu'}</span>
                          </button>
                        </td>

                        {/* Tombol Aksi */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGuest(guest);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-orange-100/80 hover:bg-orange-200 border border-orange-200/80 text-orange-900 font-bold text-[11px] inline-flex items-center gap-1 transition-colors shadow-2xs group-hover:bg-orange-500 group-hover:text-white"
                            title="Lihat Detail & Kupon Tamu"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              qr_code_2
                            </span>
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-white/75 border-t border-orange-100 flex flex-col sm:flex-row items-center justify-between text-[11.5px] text-stone-600 gap-2">
              <span>
                Menampilkan <strong>{filteredGuests.length}</strong> dari <strong>{guests.length}</strong> tamu ({stats.totalPax} Pax)
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>Total Amplop: <strong className="text-orange-900">{stats.formattedNominal}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Total Kado: <strong className="text-amber-900">{stats.kadoCount} Paket</strong></span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) - Responsif di mobile & desktop */}
      <div className="fixed bottom-20 md:bottom-8 inset-x-0 z-40 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
          <button
            onClick={() => {
              sound.playTap();
              onAddGuestClick();
            }}
            className="pointer-events-auto flex items-center gap-2.5 py-3 px-4 sm:py-3.5 sm:px-5 rounded-full btn-citrus-primary text-white shadow-xl active:scale-95 transition-all font-body text-[12.5px] sm:text-[13.5px] font-bold border border-white/40 hover:shadow-2xl hover:scale-105"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">person_add</span>
            <span>+ Tambah Tamu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
