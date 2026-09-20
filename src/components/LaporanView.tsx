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
      g.status === 'checked-in' ? 'Hadir' : 'Belum Hadir',
      g.hasEnvelope && g.envelopeNominal ? g.envelopeNominal : 0,
      `"${g.envelopeMethod || '-'}"`,
      `"${(g.giftDescription || '-').replace(/"/g, '""')}"`,
      `"${g.giftShelf || '-'}"`,
      `"${(g.notes || '-').replace(/"/g, '""')}"`,
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
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-4 pb-28">
      {/* Top Banner */}
      <div className="bg-[#f5f2fb] rounded-xl p-3.5 shadow-sm border border-[#e4e1ea]/60 relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdea5] text-[#261900] font-body text-[10px] font-bold">
              <span className="material-symbols-outlined text-[13px]">summarize</span>
              Laporan Resmi Penyelenggara
            </span>
            <h2 className="font-headline text-[16px] font-semibold text-[#1b1b21] truncate">
              Laporan Rekapitulasi Buku Tamu
            </h2>
            <p className="font-body text-[11px] text-[#7f7667] flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[13px] text-[#775a19]">
                location_on
              </span>
              Grand Ballroom Hotel Mulia • 24 Okt 2025 (18:00 - 22:00 WIB)
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#775a19]/10 flex items-center justify-center shrink-0 text-[#775a19]">
            <span className="material-symbols-outlined text-xl">analytics</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-[#e4e1ea]/50 flex items-center justify-between font-body text-[10.5px] text-[#4e4639]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Data Final Terverifikasi
          </span>
          <span className="text-[#7f7667]">Diperbarui 22:15 WIB</span>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e4e1ea]/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-[#7f7667]">Total Hadir</span>
            <span className="material-symbols-outlined text-[#775a19] text-lg">groups</span>
          </div>
          <div className="my-1">
            <span className="font-headline text-[20px] font-bold text-[#1b1b21] block leading-tight">
              {stats.totalCount}
            </span>
            <span className="font-body text-[11px] text-[#7f7667]">Jiwa Terdata</span>
          </div>
          <div className="pt-1 flex items-center gap-1 font-body text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-[#efecf5] text-[#4e4639] font-semibold">
              Pria: {stats.priaCount}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#ffdadb] text-[#7a353d] font-semibold">
              Wanita: {stats.wanitaCount}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e4e1ea]/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-[#7f7667]">Nominal Amplop</span>
            <span className="material-symbols-outlined text-[#775a19] text-lg">payments</span>
          </div>
          <div className="my-1">
            <span className="font-headline text-[20px] font-bold text-[#775a19] block leading-tight">
              {stats.nominalInJt}
            </span>
            <span className="font-body text-[10.5px] text-[#7f7667] truncate block">
              {stats.avgPerGuest}
            </span>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold text-[#241a00] bg-[#ffe088]/60 px-1.5 py-0.5 rounded">
              <span className="material-symbols-outlined text-[11px]">savings</span>
              Tunai &amp; QRIS
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e4e1ea]/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-[#7f7667]">Kado Fisik</span>
            <span className="material-symbols-outlined text-[#92484f] text-lg">
              featured_seasonal_and_gifts
            </span>
          </div>
          <div className="my-1">
            <span className="font-headline text-[20px] font-bold text-[#1b1b21] block leading-tight">
              {stats.kadoCount}
            </span>
            <span className="font-body text-[11px] text-[#7f7667]">Paket Souvenir</span>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 font-body text-[10px] font-bold text-[#7a353d] bg-[#ffdadb]/70 px-1.5 py-0.5 rounded">
              <span className="material-symbols-outlined text-[11px]">inventory_2</span>
              Box Penyimpanan #B
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e4e1ea]/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-[#7f7667]">Keamanan Data</span>
            <span className="material-symbols-outlined text-emerald-700 text-lg">cloud_done</span>
          </div>
          <div className="my-1">
            <span className="font-body text-[13px] text-[#1b1b21] font-bold block leading-tight">
              Sinkron Cloud
            </span>
            <span className="font-body text-[10.5px] text-emerald-700 flex items-center gap-0.5 mt-0.5 font-semibold">
              <span className="material-symbols-outlined text-[12px]">lock</span>
              Firebase Firestore
            </span>
          </div>
          <div className="pt-1">
            <span className="font-body text-[10px] text-[#7f7667] truncate block">
              Backup otomatis aktif
            </span>
          </div>
        </div>
      </div>

      {/* FILTER CETAK LAPORAN PDF */}
      <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e4e1ea]/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#775a19] rounded-full"></span>
            <h3 className="font-body text-[12.5px] text-[#1b1b21] uppercase tracking-wider font-bold">
              Filter Cetak Laporan PDF
            </h3>
          </div>
          <span className="font-body text-[10px] text-[#775a19] bg-[#ffdea5]/70 px-2 py-0.5 rounded-full font-bold">
            Akurat 100%
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-body text-[12px] text-[#1b1b21] font-bold">
            <span>Pilih Filter Jenis Kelamin:</span>
            <span className="text-[10.5px] text-[#7f7667] font-normal">Wajib dipilih</span>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-0.5">
            {/* Option 1: Semua */}
            <label
              onClick={() => setFilterGender('all')}
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                filterGender === 'all'
                  ? 'bg-[#f5f2fb] border-[#775a19] shadow-xs'
                  : 'bg-[#f5f2fb]/60 border-transparent hover:bg-[#eae7ef]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="filter_gender"
                  value="all"
                  checked={filterGender === 'all'}
                  onChange={() => setFilterGender('all')}
                  className="accent-[#775a19] w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body text-[12.5px] text-[#1b1b21] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#775a19]">wc</span>
                    Semua Jenis Kelamin
                  </span>
                  <span className="font-body text-[10.5px] text-[#7f7667]">
                    Daftar lengkap seluruh tamu hadir
                  </span>
                </div>
              </div>
              <span className="font-body text-[11px] bg-[#775a19] text-white px-2 py-0.5 rounded-full font-bold">
                {stats.totalCount} Tamu
              </span>
            </label>

            {/* Option 2: Hanya Pria */}
            <label
              onClick={() => setFilterGender('male')}
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                filterGender === 'male'
                  ? 'bg-[#f5f2fb] border-[#775a19] shadow-xs'
                  : 'bg-[#f5f2fb]/60 border-transparent hover:bg-[#eae7ef]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="filter_gender"
                  value="male"
                  checked={filterGender === 'male'}
                  onChange={() => setFilterGender('male')}
                  className="accent-[#775a19] w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body text-[12.5px] text-[#1b1b21] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-700">male</span>
                    Hanya Pria
                  </span>
                  <span className="font-body text-[10.5px] text-[#7f7667]">
                    Rekap khusus tamu pria
                  </span>
                </div>
              </div>
              <span className="font-body text-[11px] bg-[#eae7ef] text-[#4e4639] px-2 py-0.5 rounded-full font-bold">
                {stats.priaCount} Tamu
              </span>
            </label>

            {/* Option 3: Hanya Wanita */}
            <label
              onClick={() => setFilterGender('female')}
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                filterGender === 'female'
                  ? 'bg-[#f5f2fb] border-[#775a19] shadow-xs'
                  : 'bg-[#f5f2fb]/60 border-transparent hover:bg-[#eae7ef]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="filter_gender"
                  value="female"
                  checked={filterGender === 'female'}
                  onChange={() => setFilterGender('female')}
                  className="accent-[#775a19] w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-body text-[12.5px] text-[#1b1b21] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#92484f]">
                      female
                    </span>
                    Hanya Wanita
                  </span>
                  <span className="font-body text-[10.5px] text-[#7f7667]">
                    Rekap khusus tamu wanita
                  </span>
                </div>
              </div>
              <span className="font-body text-[11px] bg-[#ffdadb] text-[#7a353d] px-2 py-0.5 rounded-full font-bold">
                {stats.wanitaCount} Tamu
              </span>
            </label>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="pt-1 space-y-2 border-t border-[#e4e1ea]/50">
          <span className="font-body text-[12px] text-[#1b1b21] font-bold block">
            Filter Tambahan Acara:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#f5f2fb] text-[#4e4639] font-body text-[11.5px] cursor-pointer hover:bg-[#eae7ef]">
              <input
                type="checkbox"
                checked={onlyEnvelope}
                onChange={(e) => setOnlyEnvelope(e.target.checked)}
                className="accent-[#775a19] w-3.5 h-3.5 rounded"
              />
              <span className="truncate font-semibold">Khusus Beramplop</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#f5f2fb] text-[#4e4639] font-body text-[11.5px] cursor-pointer hover:bg-[#eae7ef]">
              <input
                type="checkbox"
                checked={onlyGift}
                onChange={(e) => setOnlyGift(e.target.checked)}
                className="accent-[#775a19] w-3.5 h-3.5 rounded"
              />
              <span className="truncate font-semibold">Hanya Kado Fisik</span>
            </label>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#f5f2fb] text-[#4e4639]">
            <span className="material-symbols-outlined text-base text-[#7f7667]">schedule</span>
            <span className="font-body text-[11px] text-[#1b1b21] shrink-0 font-medium">
              Rentang Waktu:
            </span>
            <span className="font-body text-[11.5px] font-bold text-[#775a19] truncate">
              18:00 - 22:00 WIB (Sesi Utama)
            </span>
          </div>
        </div>
      </div>

      {/* Pratinjau Lembar Cetak A4 */}
      <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e4e1ea]/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#775a19] text-xl">
              picture_as_pdf
            </span>
            <h4 className="font-body text-[13px] text-[#1b1b21] font-bold">
              Pratinjau Lembar Cetak A4
            </h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-2 py-1 rounded-lg bg-[#ffdea5] hover:bg-[#e9c176] text-[#261900] font-body text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Unduh langsung file PDF Resmi"
            >
              <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2 py-1 rounded-lg bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#065f46] font-body text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Unduh file Excel (.xlsx) dengan kolom rapi dan terpisah"
            >
              <span className="material-symbols-outlined text-[13px]">table_view</span>
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPrintTab}
              className="px-2 py-1 rounded-lg bg-[#f5f2fb] hover:bg-[#eae7ef] text-[#4e4639] border border-[#e4e1ea] font-body text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Buka pratinjau di tab baru untuk mencetak"
            >
              <span className="material-symbols-outlined text-[13px]">print</span>
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div
          id="print-area"
          onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
          className="bg-[#f5f2fb] rounded-lg p-2.5 relative overflow-hidden shadow-inner flex flex-col items-center cursor-pointer group"
        >
          <div className="w-full bg-white shadow-md rounded p-3 text-[9px] leading-tight space-y-2 font-body border border-[#e4e1ea]/70">
            {/* Header letterhead */}
            <div className="text-center pb-2 bg-[#f5f2fb]/60 rounded p-1.5 space-y-0.5 border-b border-[#e4e1ea]/50">
              <p className="font-headline text-[13px] text-[#775a19] font-bold tracking-widest uppercase">
                {eventTitle}
              </p>
              <p className="text-[8px] text-[#7f7667] tracking-wider font-semibold">
                OFFICIAL GUESTBOOK ATTENDANCE AUDIT REPORT
              </p>
              <div className="w-12 h-0.5 bg-[#775a19]/40 mx-auto mt-0.5"></div>
            </div>

            {/* Filter Subheading */}
            <div className="flex justify-between items-center px-1 text-[8px] text-[#7f7667]">
              <span>
                Filter:{' '}
                <strong className="text-[#1b1b21]">
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
                  <tr className="bg-[#eae7ef] text-[#4e4639] font-bold text-[8px]">
                    <th className="p-1 rounded-l">No</th>
                    <th className="p-1">Nama Tamu</th>
                    <th className="p-1">L/P</th>
                    <th className="p-1">Alamat/Instansi</th>
                    <th className="p-1">Nominal</th>
                    <th className="p-1 rounded-r">Kado</th>
                  </tr>
                </thead>
                <tbody className="text-[8px] text-[#1b1b21] divide-y divide-[#efecf5]">
                  {filteredReportGuests.slice(0, isPreviewExpanded ? 25 : 5).map((g, idx) => (
                    <tr key={g.id} className="hover:bg-[#f5f2fb]">
                      <td className="p-1 font-semibold">{String(idx + 1).padStart(2, '0')}</td>
                      <td
                        className={`p-1 font-bold truncate max-w-[80px] ${
                          g.gender === 'wanita' ? 'text-[#92484f]' : 'text-[#775a19]'
                        }`}
                      >
                        {g.name}
                      </td>
                      <td className="p-1">
                        <span
                          className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                            g.gender === 'wanita'
                              ? 'bg-rose-100 text-[#92484f]'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {g.gender === 'pria' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="p-1 truncate max-w-[65px]">{g.origin}</td>
                      <td className="p-1 font-semibold">
                        {g.hasEnvelope && g.envelopeNominal ? formatRupiah(g.envelopeNominal) : '-'}
                      </td>
                      <td className="p-1 text-[#7f7667] truncate max-w-[60px]">
                        {g.hasGift ? g.giftDescription || 'Souvenir' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="pt-2 flex justify-between items-end px-1 border-t border-[#efecf5]">
              <div className="text-[7.5px] text-[#7f7667] leading-snug">
                <p>Dicetak pada: {eventDate}, 22:20</p>
                <p className="font-mono text-[#775a19]">Hash: #EBK-9942-KC-MULIA</p>
              </div>
              <div className="text-center text-[7.5px]">
                <p className="text-[#7f7667]">Penanggung Jawab WO,</p>
                <div className="h-5 flex items-center justify-center font-headline text-[9.5px] text-[#775a19] italic font-semibold">
                  Signature
                </div>
                <p className="font-bold text-[#1b1b21] border-t pt-0.5 border-[#d1c5b4]/40">
                  Nathania Event Planner
                </p>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-center gap-1.5 pt-2 text-[#7f7667] font-body text-[11px] group-hover:text-[#775a19] transition-colors">
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

      {/* Action Buttons */}
      <div className="space-y-2 pt-1 pb-4">
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="w-full bg-[#775a19] hover:bg-[#634b15] active:scale-[0.99] transition-all text-white py-3.5 px-4 rounded-xl font-body text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#775a19]/20 cursor-pointer disabled:opacity-75"
        >
          {isGeneratingPdf ? (
            <>
              <span className="material-symbols-outlined text-2xl text-white animate-spin">progress_activity</span>
              <span>Memproses Berkas PDF A4...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl text-white">picture_as_pdf</span>
              <span>Cetak & Unduh Laporan PDF (A4)</span>
              <span className="ml-1 px-2 py-0.5 bg-[#92484f] text-white rounded text-[10px] font-bold uppercase tracking-wider">
                Resmi
              </span>
            </>
          )}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleOpenPrintTab}
            className="w-full bg-white hover:bg-[#f5f2fb] active:scale-[0.99] transition-all text-[#1b1b21] py-2.5 px-1.5 rounded-xl font-body text-[11.5px] font-semibold flex flex-col items-center justify-center gap-1 shadow-xs border border-[#e4e1ea]/70 cursor-pointer"
            title="Buka dokumen PDF di tab baru browser untuk dicetak langsung"
          >
            <span className="material-symbols-outlined text-[#775a19] text-xl">print</span>
            <span className="truncate">Cetak Tab Baru</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full bg-white hover:bg-[#f5f2fb] active:scale-[0.99] transition-all text-[#1b1b21] py-2.5 px-1.5 rounded-xl font-body text-[11.5px] font-semibold flex flex-col items-center justify-center gap-1 shadow-xs border border-[#e4e1ea]/70 cursor-pointer"
          >
            <span className="material-symbols-outlined text-emerald-700 text-xl">table_view</span>
            <span className="truncate">Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full bg-white hover:bg-[#f5f2fb] active:scale-[0.99] transition-all text-[#1b1b21] py-2.5 px-1.5 rounded-xl font-body text-[11.5px] font-semibold flex flex-col items-center justify-center gap-1 shadow-xs border border-[#e4e1ea]/70 cursor-pointer"
          >
            <span className="material-symbols-outlined text-emerald-600 text-xl">share</span>
            <span className="truncate">Kirim ke WA</span>
          </button>
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
