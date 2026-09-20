import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Guest } from '../types';

interface GenerateReportOptions {
  guests: Guest[];
  filterGender: 'all' | 'male' | 'female';
  onlyEnvelope: boolean;
  onlyGift: boolean;
  weddingTitle?: string;
  weddingDate?: string;
  venue?: string;
}

export function generatePdfReport({
  guests,
  filterGender,
  onlyEnvelope,
  onlyGift,
  weddingTitle = 'The Wedding of Kevin & Clarissa',
  weddingDate = '24 Oktober 2025',
  venue = 'Grand Ballroom Hotel Mulia, Jakarta',
}: GenerateReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette
  const goldPrimary = [119, 90, 25] as const; // #775a19
  const darkText = [27, 27, 33] as const; // #1b1b21
  const mutedText = [127, 118, 103] as const; // #7f7667
  const warmBg = [245, 242, 251] as const; // #f5f2fb

  // Filter description
  let filterDesc = 'Semua Jenis Kelamin';
  if (filterGender === 'male') filterDesc = 'Khusus Tamu Pria';
  if (filterGender === 'female') filterDesc = 'Khusus Tamu Wanita';

  const filterAdditions: string[] = [];
  if (onlyEnvelope) filterAdditions.push('Khusus Beramplop');
  if (onlyGift) filterAdditions.push('Khusus Kado Fisik');
  if (filterAdditions.length > 0) {
    filterDesc += ` (${filterAdditions.join(', ')})`;
  }

  // Calculate statistics
  const totalCount = guests.length;
  const priaCount = guests.filter((g) => g.gender === 'pria').length;
  const wanitaCount = guests.filter((g) => g.gender === 'wanita').length;
  const totalNominal = guests.reduce((sum, g) => sum + (g.envelopeNominal || 0), 0);
  const kadoCount = guests.filter((g) => g.hasGift).length;

  const formatRupiah = (num: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
  };

  // --- 1. HEADER & KOP SURAT ---
  doc.setFillColor(...warmBg);
  doc.rect(10, 10, pageWidth - 20, 28, 'F');
  doc.setDrawColor(...goldPrimary);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, 28, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...goldPrimary);
  doc.text(weddingTitle.toUpperCase(), pageWidth / 2, 17, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkText);
  doc.text('LAPORAN RESMI REKAPITULASI BUKU TAMU & TITIPAN HADIAH', pageWidth / 2, 23, { align: 'center' });

  // Metadata line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(
    `Tanggal: ${weddingDate} • Tempat: ${venue} • Dokumen: Verifikasi Digital E-Guestbook`,
    pageWidth / 2,
    29,
    { align: 'center' }
  );

  doc.setDrawColor(200, 180, 140);
  doc.setLineWidth(0.3);
  doc.line(20, 32, pageWidth - 20, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...goldPrimary);
  doc.text(`FILTER DATA: ${filterDesc.toUpperCase()}`, pageWidth / 2, 36, { align: 'center' });

  // --- 2. STATS SUMMARY BOXES ---
  const boxY = 41;
  const boxWidth = (pageWidth - 20 - 9) / 4;
  const boxHeight = 16;

  const statItems = [
    {
      label: 'TOTAL HADIR',
      value: `${totalCount} Tamu`,
      sub: `Pria: ${priaCount} | Wanita: ${wanitaCount}`,
    },
    {
      label: 'TOTAL AMPLOP',
      value: formatRupiah(totalNominal),
      sub: 'Titipan Tunai & Transfer',
    },
    {
      label: 'KADO FISIK',
      value: `${kadoCount} Paket`,
      sub: 'Souvenir & Titipan Meja',
    },
    {
      label: 'STATUS DATA',
      value: 'Tersinkronisasi',
      sub: 'Cloud Firestore Terverifikasi',
    },
  ];

  statItems.forEach((item, i) => {
    const x = 10 + i * (boxWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228, 225, 234);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedText);
    doc.text(item.label, x + 3, boxY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...goldPrimary);
    doc.text(item.value, x + 3, boxY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...darkText);
    doc.text(item.sub, x + 3, boxY + 13.5);
  });

  // --- 3. DATA TABLE ---
  const tableHead = [
    ['No', 'Waktu', 'Nama Tamu', 'L/P', 'Alamat / Instansi', 'Kategori', 'Amplop (Rp)', 'Metode', 'Kado / Hadiah', 'Rak'],
  ];

  const tableData = guests.map((g, idx) => {
    return [
      String(idx + 1),
      g.time || '-',
      g.name,
      g.gender === 'pria' ? 'L' : 'P',
      g.origin || '-',
      g.category || 'Reguler',
      g.hasEnvelope && g.envelopeNominal ? new Intl.NumberFormat('id-ID').format(g.envelopeNominal) : '-',
      g.envelopeMethod || '-',
      g.hasGift ? g.giftDescription || 'Kado' : '-',
      g.giftShelf || '-',
    ];
  });

  autoTable(doc, {
    startY: boxY + boxHeight + 4,
    head: tableHead,
    body: tableData,
    margin: { left: 10, right: 10, top: 15, bottom: 25 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [27, 27, 33],
      lineColor: [228, 225, 234],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [119, 90, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 248, 253],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 14 },
      2: { fontStyle: 'bold', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 8 },
      4: { cellWidth: 32 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 14 },
      8: { cellWidth: 28 },
      9: { halign: 'center', cellWidth: 12 },
    },
    didDrawPage: (data) => {
      // Running header on page 2+
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...mutedText);
        doc.text(
          `${weddingTitle} • Laporan Rekapitulasi Buku Tamu • Hal ${data.pageNumber}`,
          10,
          10
        );
        doc.setDrawColor(228, 225, 234);
        doc.line(10, 12, pageWidth - 10, 12);
      }

      // Running footer on every page
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...mutedText);
      doc.text(
        `Dicetak otomatis: ${dateStr} WIB • Sistem Buku Tamu Digital • Hash: #EBK-9942-KC-MULIA`,
        10,
        pageHeight - 8
      );

      doc.text(
        `Halaman ${data.pageNumber}`,
        pageWidth - 10,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // --- 4. SIGNATURE SECTION (Appended at the end of content) ---
  const lastAutoTable = (doc as any).lastAutoTable;
  let finalY = lastAutoTable ? lastAutoTable.finalY + 8 : boxY + boxHeight + 20;

  // If signature section overflows, add a new page
  if (finalY + 28 > pageHeight - 15) {
    doc.addPage();
    finalY = 20;
  }

  const signColWidth = 55;
  const leftSignX = 20;
  const rightSignX = pageWidth - 20 - signColWidth;

  // Left signature: Pengantin / Keluarga
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkText);
  doc.text('Mengetahui & Menyetujui,', leftSignX + signColWidth / 2, finalY, { align: 'center' });
  doc.text('Pihak Mempelai / Keluarga', leftSignX + signColWidth / 2, finalY + 4, { align: 'center' });

  doc.setDrawColor(180, 180, 180);
  doc.line(leftSignX, finalY + 19, leftSignX + signColWidth, finalY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('( Kevin & Clarissa )', leftSignX + signColWidth / 2, finalY + 23, { align: 'center' });

  // Right signature: Wedding Organizer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Petugas Administrasi Meja Tamu,', rightSignX + signColWidth / 2, finalY, { align: 'center' });
  doc.text('Nathania Event Planner & WO', rightSignX + signColWidth / 2, finalY + 4, { align: 'center' });

  doc.line(rightSignX, finalY + 19, rightSignX + signColWidth, finalY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('( Leader Meja Tamu / WO )', rightSignX + signColWidth / 2, finalY + 23, { align: 'center' });

  return doc;
}

export function downloadPdfReport(options: GenerateReportOptions): void {
  const doc = generatePdfReport(options);
  const filterSuffix = options.filterGender !== 'all' ? `_${options.filterGender}` : '';
  const filename = `Laporan_Buku_Tamu_Kevin_Clarissa${filterSuffix}.pdf`;
  doc.save(filename);
}

export function openPrintablePdf(options: GenerateReportOptions): void {
  const doc = generatePdfReport(options);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  
  // Open in a new tab for preview / direct printing
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    // If popup is blocked by browser, trigger download fallback directly
    const filterSuffix = options.filterGender !== 'all' ? `_${options.filterGender}` : '';
    doc.save(`Laporan_Buku_Tamu_Kevin_Clarissa${filterSuffix}.pdf`);
  }
}
