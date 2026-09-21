import React, { useState, useMemo } from 'react';
import { Guest, UserSession } from '../types';
import { downloadPdfReport, openPrintablePdf } from '../lib/generatePdfReport';
import { exportToExcel } from '../lib/generateExcelReport';
import { sound } from '../utils/sound';

interface LaporanViewProps {
  guests: Guest[];
  session?: UserSession;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ guests, session }) => {
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [onlyEnvelope, setOnlyEnvelope] = useState(false);
  const [onlyGift, setOnlyGift] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const eventTitle = session?.weddingTitle || 'The Wedding of Kevin & Clarissa';
  const eventDate = session?.weddingDate || '24 Oktober 2025';

  const stats = useMemo(() => {
    const totalCount = guests.length;
    const priaCount = guests.filter((g) => g.gender === 'pria').length;
    const wanitaCount = guests.filter((g) => g.gender === 'wanita').length;
    const totalNominal = guests.reduce((sum, g) => sum + (g.envelopeNominal || 0), 0);
    const kadoCount = guests.filter((g) => g.hasGift).length;
    const avgPerGuest = totalCount > 0 ? Math.round(totalNominal / totalCount / 1000) : 0;
    const nominalInJt = (totalNominal / 1000000).toFixed(1).replace('.', ',');

    return {
      totalCount,
      priaCount,
      wanitaCount,
      totalNominal,
      nominalInJt: `Rp ${nominalInJt} Jt`,
      avgPerGuest: `Avg: Rp ${avgPerGuest}rb / tamu`,
      kadoCount,
    };
  }, [guests]);

  // Filtered dataset for preview and export
  const filteredReportGuests = useMemo(() => {
    return guests.filter((g) => {
      if (filterGender === 'male' && g.gender !== 'pria') return false;
      if (filterGender === 'female' && g.gender !== 'wanita') return false;
      if (onlyEnvelope && !g.hasEnvelope) return false;
      if (onlyGift && !g.hasGift) return false;
      return true;
    });
  }, [guests, filterGender, onlyEnvelope, onlyGift]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDownloadPDF = () => {
    sound.playTap();
    setIsGeneratingPdf(true);
    showToast('Sedang membuat berkas PDF A4 resmi...');

    setTimeout(() => {
      try {
        downloadPdfReport({
          guests: filteredReportGuests,
          filterGender,
          onlyEnvelope,
          onlyGift,
          weddingTitle: eventTitle,
          weddingDate: eventDate,
          venue: 'Grand Ballroom Hotel Mulia, Jakarta',
        });
        sound.playSuccess();
        showToast('Dokumen PDF berhasil dibuat dan diunduh ke perangkat Anda!');
      } catch (err) {
        console.error('Failed to download PDF:', err);
        showToast('Gagal memproses PDF. Silakan coba kembali.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 200);
  };

  const handleOpenPrintTab = () => {
    sound.playTap();
    showToast('Membuka pratinjau cetak PDF...');
    try {
      openPrintablePdf({
        guests: filteredReportGuests,
        filterGender,
        onlyEnvelope,
        onlyGift,
        weddingTitle: eventTitle,
        weddingDate: eventDate,
        venue: 'Grand Ballroom Hotel Mulia, Jakarta',
      });
    } catch (err) {
      console.error('Failed to open PDF tab:', err);
      handleDownloadPDF();
    }
  };

  const handleExportExcel = () => {
    sound.playTap();
    showToast('Membuat berkas Excel (.xlsx) resmi & rapi...');
    try {
      exportToExcel({
        guests: filteredReportGuests,
        filterGender,
        onlyEnvelope,
        onlyGift,
        weddingTitle: eventTitle,
        weddingDate: eventDate,
        venue: 'Grand Ballroom Hotel Mulia, Jakarta',
      });
      sound.playSuccess();
      showToast('Berkas Excel (.xlsx) berhasil diunduh dengan kolom rapi!');
    } catch (err) {
      console.error('Failed to export Excel:', err);
      showToast('Gagal memproses berkas Excel.');
    }
  };

  const handleExportCSV = () => {
    sound.playTap();
    showToast('Mengunduh dataset buku tamu format CSV...');

    const headers = ['No', 'Waktu Hadir', 'Nama Tamu', 'L/P', 'Alamat / Instansi', 'Kategori', 'Kehadiran', 'Amplop (Rp)', 'Metode', 'Kado', 'Rak', 'Catatan'];
    const rows = filteredReportGuests.map((g, idx) => [
      idx + 1,
      `"${g.time || '-'}"`,
      `"${g.name.replace(/"/g, '""')}"`,
      g.gender === 'pria' ? 'L' : 'P',
      `"${(g.origin || '-').replace(/"/g, '""')}"`,
      `"${g.category || 'Reguler'}"`,
      g.isVerified ? 'Hadir (Terverifikasi)' : 'Hadir',
      g.hasEnvelope && g.envelopeNominal ? g.envelopeNominal : 0,
      `"${g.envelopeMethod || '-'}"`,
      `"${(g.giftDescription || '-').replace(/"/g, '""')}"`,
      `"${g.giftShelf || '-'}"`,
      `"${(g.prayerWish || '-').replace(/"/g, '""')}"`,
    ]);

    // Include UTF-8 BOM (\uFEFF) and sep=, directive so Excel correctly parses columns without merging into A1
    const csvContent = '\uFEFFsep=,\r\n' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Rekapitulasi_Buku_Tamu_Kevin_Clarissa_${dateStamp}_${filterGender}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    showToast('Menghubungkan ke WhatsApp Pengantin...');
    const message = `*LAPORAN RESMI BUKU TAMU PERNIKAHAN*\n*The Wedding of Kevin & Clarissa*\nTanggal: 24 Oktober 2025\nLokasi: Grand Ballroom Hotel Mulia\n\n- Total Tamu Hadir: *${stats.totalCount} Jiwa* (Pria: ${stats.priaCount}, Wanita: ${stats.wanitaCount})\n- Total Nominal Titipan Amplop: *${stats.nominalInJt}*\n- Total Kado Fisik Diterima: *${stats.kadoCount} Paket*\n- Status Cloud: *Tersinkronisasi 100% Firebase Firestore*\n\nHash Keamanan: #EBK-9942-KC-MULIA\nWedding Organizer: Nathania Event Planner`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const formatRupiah = (num?: number) => {
    if (!num) return '-';
    return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 pb-28 md:pb-16">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xs border border-white/90 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-body text-[11px] font-bold border border-orange-200">
              <span className="material-symbols-outlined text-[13px]">summarize</span>
              Laporan Resmi Penyelenggara
            </span>
            <h2 className="font-headline text-[17px] sm:text-[20px] font-bold text-stone-900 truncate">
              Laporan Rekapitulasi Buku Tamu
            </h2>
            <p className="font-body text-[11.5px] sm:text-[12.5px] text-stone-600 flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[15px] text-orange-600">
                location_on
              </span>
              Grand Ballroom Hotel Mulia • 24 Okt 2025 (18:00 - 22:00 WIB)
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0 text-orange-700 border border-orange-200">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between font-body text-[11px] text-stone-600">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Data Final Terverifikasi Realtime
          </span>
          <span className="text-stone-500">Diperbarui: Sesi Resepsi</span>
        </div>
      </div>

      {/* 4 Summary Stat Cards - Responsive 4 columns on md/lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4 shadow-xs border border-white/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11.5px] text-stone-600 font-medium">Total Hadir</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">groups</span>
            </div>
          </div>
          <div className="my-1.5">
            <span className="font-headline text-[22px] sm:text-[26px] font-extrabold text-stone-900 block leading-tight">
              {stats.totalCount}
            </span>
            <span className="font-body text-[11px] text-stone-500">Jiwa Terdata</span>
          </div>
          <div className="pt-1 flex items-center gap-1 font-body text-[10.5px]">
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold border border-stone-200">
              Pria: {stats.priaCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
              Wanita: {stats.wanitaCount}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4 shadow-xs border border-white/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11.5px] text-stone-600 font-medium">Nominal Amplop</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
          </div>
          <div className="my-1.5">
            <span className="font-headline text-[22px] sm:text-[26px] font-extrabold text-orange-700 block leading-tight">
              {stats.nominalInJt}
            </span>
            <span className="font-body text-[11px] text-stone-500 truncate block">
              {stats.avgPerGuest}
            </span>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-body font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
              <span className="material-symbols-outlined text-[12px]">savings</span>
              Tunai &amp; QRIS
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4 shadow-xs border border-white/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11.5px] text-stone-600 font-medium">Kado Fisik</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">featured_seasonal_and_gifts</span>
            </div>
          </div>
          <div className="my-1.5">
            <span className="font-headline text-[22px] sm:text-[26px] font-extrabold text-stone-900 block leading-tight">
              {stats.kadoCount}
            </span>
            <span className="font-body text-[11px] text-stone-500">Paket Souvenir</span>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 font-body text-[10.5px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <span className="material-symbols-outlined text-[12px]">inventory_2</span>
              Box Penyimpanan #B
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4 shadow-xs border border-white/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11.5px] text-stone-600 font-medium">Keamanan Data</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">cloud_done</span>
            </div>
          </div>
          <div className="my-1.5">
            <span className="font-headline text-[16px] sm:text-[18px] text-stone-900 font-bold block leading-tight">
              Cloud Database
            </span>
            <span className="font-body text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5 font-bold">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Firebase Firestore
            </span>
          </div>
          <div className="pt-1">
            <span className="font-body text-[10.5px] text-stone-500 truncate block">
              Sinkron aman otomatis
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls & Actions on Left, PDF Preview on Right on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Filter & Action Buttons */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* FILTER CETAK LAPORAN PDF */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs border border-white/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                <h3 className="font-body text-[13px] text-stone-900 uppercase tracking-wider font-bold">
                  Filter Cetak Laporan PDF
                </h3>
              </div>
              <span className="font-body text-[10.5px] text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full font-bold border border-orange-200">
                Akurat 100%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-body text-[12px] text-stone-800 font-bold">
                <span>Pilih Filter Jenis Kelamin:</span>
                <span className="text-[10.5px] text-stone-500 font-normal">Wajib dipilih</span>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-0.5">
                {/* Option 1: Semua */}
                <label
                  onClick={() => setFilterGender('all')}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    filterGender === 'all'
                      ? 'bg-orange-50/90 border-orange-300 shadow-xs'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="filter_gender"
                      value="all"
                      checked={filterGender === 'all'}
                      onChange={() => setFilterGender('all')}
                      className="accent-orange-600 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-body text-[13px] text-stone-900 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-orange-600">wc</span>
                        Semua Jenis Kelamin
                      </span>
                      <span className="font-body text-[10.5px] text-stone-500">
                        Daftar lengkap seluruh tamu hadir
                      </span>
                    </div>
                  </div>
                  <span className="font-body text-[11px] bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-bold">
                    {stats.totalCount} Tamu
                  </span>
                </label>

                {/* Option 2: Hanya Pria */}
                <label
                  onClick={() => setFilterGender('male')}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    filterGender === 'male'
                      ? 'bg-orange-50/90 border-orange-300 shadow-xs'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="filter_gender"
                      value="male"
                      checked={filterGender === 'male'}
                      onChange={() => setFilterGender('male')}
                      className="accent-orange-600 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-body text-[13px] text-stone-900 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-orange-600">male</span>
                        Hanya Pria
                      </span>
                      <span className="font-body text-[10.5px] text-stone-500">
                        Rekap khusus tamu pria
                      </span>
                    </div>
                  </div>
                  <span className="font-body text-[11px] bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full font-bold">
                    {stats.priaCount} Tamu
                  </span>
                </label>

                {/* Option 3: Hanya Wanita */}
                <label
                  onClick={() => setFilterGender('female')}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    filterGender === 'female'
                      ? 'bg-orange-50/90 border-orange-300 shadow-xs'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="filter_gender"
                      value="female"
                      checked={filterGender === 'female'}
                      onChange={() => setFilterGender('female')}
                      className="accent-orange-600 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-body text-[13px] text-stone-900 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-rose-600">female</span>
                        Hanya Wanita
                      </span>
                      <span className="font-body text-[10.5px] text-stone-500">
                        Rekap khusus tamu wanita
                      </span>
                    </div>
                  </div>
                  <span className="font-body text-[11px] bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">
                    {stats.wanitaCount} Tamu
                  </span>
                </label>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="pt-2 space-y-2.5 border-t border-stone-200/60">
              <span className="font-body text-[12px] text-stone-800 font-bold block">
                Filter Tambahan Acara:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/80 text-stone-700 font-body text-[11.5px] cursor-pointer hover:bg-white border border-stone-200/60">
                  <input
                    type="checkbox"
                    checked={onlyEnvelope}
                    onChange={(e) => setOnlyEnvelope(e.target.checked)}
                    className="accent-orange-600 w-3.5 h-3.5 rounded"
                  />
                  <span className="truncate font-semibold">Khusus Beramplop</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/80 text-stone-700 font-body text-[11.5px] cursor-pointer hover:bg-white border border-stone-200/60">
                  <input
                    type="checkbox"
                    checked={onlyGift}
                    onChange={(e) => setOnlyGift(e.target.checked)}
                    className="accent-orange-600 w-3.5 h-3.5 rounded"
                  />
                  <span className="truncate font-semibold">Hanya Kado Fisik</span>
                </label>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 text-stone-700 border border-stone-200/60">
                <span className="material-symbols-outlined text-base text-stone-500">schedule</span>
                <span className="font-body text-[11px] text-stone-700 shrink-0 font-medium">
                  Rentang Waktu:
                </span>
                <span className="font-body text-[11.5px] font-bold text-orange-700 truncate">
                  18:00 - 22:00 WIB (Sesi Utama)
                </span>
              </div>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="space-y-2.5">
            {/* Primary Export 1: PDF Official */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full btn-citrus-primary active:scale-[0.99] transition-all text-white py-3.5 px-4 rounded-2xl font-body text-[13.5px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-75"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="material-symbols-outlined text-2xl text-white animate-spin">progress_activity</span>
                  <span>Memproses Berkas PDF A4...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl text-white">picture_as_pdf</span>
                  <span>Cetak &amp; Unduh Laporan PDF (A4)</span>
                  <span className="ml-1 px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    Resmi
                  </span>
                </>
              )}
            </button>

            {/* Primary Export 2: Professional Excel .xlsx */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full bg-[#107c41] hover:bg-[#0c6233] active:scale-[0.99] transition-all text-white py-3.5 px-4 rounded-2xl font-body text-[13.5px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#107c41]/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl text-white">table_view</span>
              <span>Unduh Laporan Excel (.xlsx)</span>
              <span className="ml-1 px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                Format Rapi
              </span>
            </button>

            {/* Secondary Action Bar */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleOpenPrintTab}
                className="w-full bg-white/90 hover:bg-white active:scale-[0.99] transition-all text-stone-800 py-2.5 px-2 rounded-xl font-body text-[11.5px] font-semibold flex flex-col items-center justify-center gap-1 shadow-xs border border-stone-200/80 cursor-pointer"
                title="Buka dokumen PDF di tab baru browser untuk dicetak langsung"
              >
                <span className="material-symbols-outlined text-orange-600 text-lg">print</span>
                <span className="truncate">Cetak Tab Baru</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full bg-white/90 hover:bg-white active:scale-[0.99] transition-all text-stone-800 py-2.5 px-2 rounded-xl font-body text-[11.5px] font-semibold flex flex-col items-center justify-center gap-1 shadow-xs border border-stone-200/80 cursor-pointer"
                title="Unduh format CSV dengan pemisah koma terstandar"
              >
                <span className="material-symbols-outlined text-stone-600 text-lg">description</span>
                <span className="truncate">Ekspor CSV</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-white/90 hover:bg-white active:scale-[0.99] transition-all text-stone-800 py-2.5 px-2 rounded-xl font-body text-[11.5px] font-semibold flex flex-col items-center justify-center gap-1 shadow-xs border border-stone-200/80 cursor-pointer"
              >
                <span className="material-symbols-outlined text-emerald-600 text-lg">share</span>
                <span className="truncate">Kirim ke WA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pratinjau Lembar Cetak A4 */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xs border border-white/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-xl">
                  picture_as_pdf
                </span>
                <h4 className="font-body text-[13.5px] text-stone-900 font-bold">
                  Pratinjau Lembar Cetak A4
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 font-body text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 border border-orange-200"
                  title="Unduh langsung file PDF Resmi"
                >
                  <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-body text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                  title="Unduh file Excel (.xlsx)"
                >
                  <span className="material-symbols-outlined text-[14px]">table_view</span>
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenPrintTab}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-body text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Buka pratinjau di tab baru untuk mencetak"
                >
                  <span className="material-symbols-outlined text-[14px]">print</span>
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* Paper Container */}
            <div
              id="print-area"
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
              className="bg-stone-100/80 rounded-xl p-3 sm:p-4 relative overflow-hidden shadow-inner flex flex-col items-center cursor-pointer group border border-stone-200/60"
            >
              <div className="w-full bg-white shadow-md rounded-lg p-3.5 sm:p-5 text-[9px] sm:text-[10px] leading-tight space-y-2.5 font-body border border-stone-200">
                {/* Header letterhead */}
                <div className="text-center pb-2.5 bg-orange-50/50 rounded-lg p-2 space-y-0.5 border-b border-orange-200/60">
                  <p className="font-headline text-[14px] sm:text-[16px] text-stone-900 font-bold tracking-widest uppercase">
                    {eventTitle}
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] text-stone-500 tracking-wider font-semibold">
                    OFFICIAL GUESTBOOK ATTENDANCE AUDIT REPORT
                  </p>
                  <div className="w-12 h-0.5 bg-orange-400 mx-auto mt-0.5"></div>
                </div>

                {/* Filter Subheading */}
                <div className="flex justify-between items-center px-1 text-[8.5px] text-stone-600">
                  <span>
                    Filter:{' '}
                    <strong className="text-stone-900">
                      {filterGender === 'all'
                        ? `Semua Jenis Kelamin (${filteredReportGuests.length} Tamu)`
                        : filterGender === 'male'
                        ? `Hanya Pria (${filteredReportGuests.length} Tamu)`
                        : `Hanya Wanita (${filteredReportGuests.length} Tamu)`}
                    </strong>
                  </span>
                  <span>Venue: Grand Ballroom Mulia</span>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-100 text-stone-700 font-bold text-[8.5px]">
                        <th className="p-1 rounded-l">No</th>
                        <th className="p-1">Nama Tamu</th>
                        <th className="p-1">L/P</th>
                        <th className="p-1">Alamat/Instansi</th>
                        <th className="p-1">Nominal</th>
                        <th className="p-1 rounded-r">Kado</th>
                      </tr>
                    </thead>
                    <tbody className="text-[8.5px] text-stone-800 divide-y divide-stone-100">
                      {filteredReportGuests.slice(0, isPreviewExpanded ? 25 : 8).map((g, idx) => (
                        <tr key={g.id} className="hover:bg-orange-50/50">
                          <td className="p-1 font-semibold text-stone-500">{String(idx + 1).padStart(2, '0')}</td>
                          <td
                            className={`p-1 font-bold truncate max-w-[100px] ${
                              g.gender === 'wanita' ? 'text-rose-700' : 'text-orange-700'
                            }`}
                          >
                            {g.name}
                          </td>
                          <td className="p-1">
                            <span
                              className={`px-1 py-0.2 rounded text-[7.5px] font-bold ${
                                g.gender === 'wanita'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {g.gender === 'pria' ? 'L' : 'P'}
                            </span>
                          </td>
                          <td className="p-1 truncate max-w-[85px] text-stone-600">{g.origin}</td>
                          <td className="p-1 font-semibold text-orange-700">
                            {g.hasEnvelope && g.envelopeNominal ? formatRupiah(g.envelopeNominal) : '-'}
                          </td>
                          <td className="p-1 text-stone-500 truncate max-w-[70px]">
                            {g.hasGift ? g.giftDescription || 'Souvenir' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Signatures */}
                <div className="pt-2 flex justify-between items-end px-1 border-t border-stone-200">
                  <div className="text-[8px] text-stone-500 leading-snug">
                    <p>Dicetak pada: {eventDate}, 22:20</p>
                    <p className="font-mono text-orange-700">Hash: #EBK-9942-KC-MULIA</p>
                  </div>
                  <div className="text-center text-[8px]">
                    <p className="text-stone-500">Penanggung Jawab WO,</p>
                    <div className="h-5 flex items-center justify-center font-headline text-[10px] text-orange-700 italic font-semibold">
                      Nathania Planner
                    </div>
                    <p className="font-bold text-stone-900 border-t pt-0.5 border-stone-300">
                      Nathania Event Planner
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full flex items-center justify-center gap-1.5 pt-2 text-stone-500 font-body text-[11px] group-hover:text-orange-700 transition-colors">
                <span className="material-symbols-outlined text-sm">
                  {isPreviewExpanded ? 'zoom_out' : 'zoom_in'}
                </span>
                <span>
                  {isPreviewExpanded
                    ? 'Klik untuk memperkecil tampilan ringkas'
                    : `Klik untuk melihat lebih banyak data (${filteredReportGuests.length} tamu terfilter)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-[#303036] text-white p-3 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#775a19] flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-sm">done</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[12px] font-bold text-white truncate">
                {toastMessage}
              </span>
              <span className="font-body text-[10px] text-white/70">
                Data resmi The Wedding of Kevin &amp; Clarissa
              </span>
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white p-1"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
