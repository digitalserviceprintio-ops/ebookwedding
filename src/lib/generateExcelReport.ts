import * as XLSX from 'xlsx';
import { Guest } from '../types';

interface GenerateExcelOptions {
  guests: Guest[];
  filterGender: 'all' | 'male' | 'female';
  onlyEnvelope: boolean;
  onlyGift: boolean;
  weddingTitle?: string;
  weddingDate?: string;
  venue?: string;
}

export function exportToExcel({
  guests,
  filterGender,
  onlyEnvelope,
  onlyGift,
  weddingTitle = 'The Wedding of Kevin & Clarissa',
  weddingDate = '24 Oktober 2025',
  venue = 'Grand Ballroom Hotel Mulia, Jakarta',
}: GenerateExcelOptions): void {
  // 1. Calculate Summary Statistics
  const totalCount = guests.length;
  const priaCount = guests.filter((g) => g.gender === 'pria').length;
  const wanitaCount = guests.filter((g) => g.gender === 'wanita').length;
  const totalNominal = guests.reduce((sum, g) => sum + (g.envelopeNominal || 0), 0);
  const totalKado = guests.filter((g) => g.hasGift).length;
  const totalAmplopCount = guests.filter((g) => g.hasEnvelope).length;

  let filterLabel = 'Semua Tamu';
  if (filterGender === 'male') filterLabel = 'Hanya Pria';
  if (filterGender === 'female') filterLabel = 'Hanya Wanita';
  const filterDetails: string[] = [];
  if (onlyEnvelope) filterDetails.push('Khusus Beramplop');
  if (onlyGift) filterDetails.push('Khusus Kado Fisik');
  if (filterDetails.length > 0) {
    filterLabel += ` (${filterDetails.join(', ')})`;
  }

  // 2. Build Rows Array for Sheet
  const sheetData: any[][] = [
    // Header Title
    ['LAPORAN REKAPITULASI BUKU TAMU DIGITAL & TITIPAN HADIAH'],
    [weddingTitle.toUpperCase()],
    [`Tanggal Acara: ${weddingDate} | Lokasi: ${venue}`],
    [`Dicetak Otomatis pada: ${new Date().toLocaleString('id-ID')} WIB | Sistem E-Guestbook`],
    [], // Empty row
    // Summary Cards / Stats
    ['RINGKASAN DATA RESEPSI'],
    ['Total Tamu Hadir', `${totalCount} Orang`, '', 'Total Pria', `${priaCount} Orang`, '', 'Total Wanita', `${wanitaCount} Orang`],
    ['Total Nominal Amplop', totalNominal, '', 'Jumlah Amplop', `${totalAmplopCount} Titipan`, '', 'Jumlah Kado Fisik', `${totalKado} Paket`],
    ['Filter Diterapkan', filterLabel, '', 'Status Sinkronisasi', 'Cloud Firestore Aktif Terverifikasi'],
    [], // Empty row
    // Table Headers
    [
      'No',
      'Waktu Hadir',
      'Nama Lengkap Tamu',
      'L/P',
      'Alamat / Instansi',
      'Kategori',
      'Kehadiran',
      'Nominal Amplop (Rp)',
      'Metode Amplop',
      'Kado / Hadiah Fisik',
      'Posisi Rak Kado',
      'Catatan / Ucapan',
    ],
  ];

  // 3. Populate Guest Data Rows
  guests.forEach((g, idx) => {
    sheetData.push([
      idx + 1,
      g.time || '-',
      g.name,
      g.gender === 'pria' ? 'L' : 'P',
      g.origin || '-',
      g.category || 'Reguler',
      g.isVerified ? 'Terverifikasi' : 'Hadir',
      g.hasEnvelope && g.envelopeNominal ? g.envelopeNominal : 0,
      g.envelopeMethod ? g.envelopeMethod.toUpperCase() : '-',
      g.hasGift ? g.giftDescription || 'Kado' : '-',
      g.giftShelf || '-',
      g.prayerWish || '-',
    ]);
  });

  // 4. Add Summary / Total Row at the bottom
  sheetData.push([]);
  sheetData.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    `${totalCount} Hadir`,
    totalNominal,
    `${totalAmplopCount} Amplop`,
    `${totalKado} Kado`,
    '',
    'Laporan Resmi Terverifikasi',
  ]);

  // 5. Create Worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Format currency cells in data rows and summary row
  const startDataRow = 10; // 0-indexed row for first guest data
  const endDataRow = startDataRow + guests.length;

  for (let r = startDataRow; r < endDataRow; r++) {
    const nominalCellRef = XLSX.utils.encode_cell({ r, c: 7 }); // Column H (Nominal Amplop)
    if (ws[nominalCellRef] && typeof ws[nominalCellRef].v === 'number') {
      ws[nominalCellRef].z = '#,##0';
    }
  }

  // Format Total Row (at endDataRow + 1)
  const totalRowIndex = endDataRow + 1;
  const totalNominalCellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: 7 });
  if (ws[totalNominalCellRef] && typeof ws[totalNominalCellRef].v === 'number') {
    ws[totalNominalCellRef].z = '"Rp "#,##0';
  }

  // Format header summary nominal cell (Row 7, Column B => r: 7, c: 1)
  const summaryStatRef = XLSX.utils.encode_cell({ r: 7, c: 1 });
  if (ws[summaryStatRef] && typeof ws[summaryStatRef].v === 'number') {
    ws[summaryStatRef].z = '"Rp "#,##0';
  }

  // Define Column Widths (in characters) so cells are neat and never cut off
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Waktu
    { wch: 32 }, // Nama Tamu
    { wch: 8 },  // L/P
    { wch: 28 }, // Alamat/Instansi
    { wch: 16 }, // Kategori
    { wch: 14 }, // Kehadiran
    { wch: 22 }, // Nominal Amplop (Rp)
    { wch: 18 }, // Metode
    { wch: 30 }, // Kado Fisik
    { wch: 16 }, // Posisi Rak
    { wch: 35 }, // Catatan
  ];

  // Merge cells for title lines
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }, // Subtitle
    { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }, // Event Date & Venue
    { s: { r: 3, c: 0 }, e: { r: 3, c: 11 } }, // Print Date
    { s: { r: 5, c: 0 }, e: { r: 5, c: 11 } }, // Ringkasan header
  ];

  // 6. Create Workbook and Append Sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Tamu');

  // 7. Trigger Direct Native .XLSX File Download
  const filterSuffix = filterGender !== 'all' ? `_${filterGender}` : '';
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `Laporan_Buku_Tamu_Kevin_Clarissa_${dateStamp}${filterSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName, { bookType: 'xlsx', type: 'binary' });
}
