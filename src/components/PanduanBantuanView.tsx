import React, { useState } from 'react';
import { TabType } from '../types';
import { sound } from '../utils/sound';

interface PanduanBantuanViewProps {
  onNavigateToTab: (tab: TabType) => void;
}

interface GuideItem {
  id: string;
  category: 'checkin' | 'amplop' | 'souvenir' | 'laporan' | 'multi-meja';
  title: string;
  shortDesc: string;
  icon: string;
  badge: string;
  steps: string[];
  tips?: string;
}

export const PanduanBantuanView: React.FC<PanduanBantuanViewProps> = ({
  onNavigateToTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('guide-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  const contactEmail = 'digitalserviceprint.io@gmail.com';
  const contactPhone = '+6282186371356';
  const waUrl = `https://wa.me/6282186371356?text=${encodeURIComponent(
    'Halo Tim Dukungan Wedding Book Digital, saya membutuhkan bantuan terkait operasional aplikasi:'
  )}`;

  const handleCopy = (text: string, type: string) => {
    sound.playTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedContact(type);
      setTimeout(() => setCopiedContact(null), 2500);
    }
  };

  const guides: GuideItem[] = [
    {
      id: 'guide-1',
      category: 'checkin',
      title: 'Pencarian & Verifikasi Kehadiran Tamu (Check-In)',
      shortDesc: 'Alur cepat menyambut tamu di meja resepsionis dan menandai status hadir.',
      icon: 'how_to_reg',
      badge: 'Meja Depan',
      steps: [
        'Buka menu "Buku Tamu" pada navigasi samping atau bawah.',
        'Ketik nama tamu pada bilah pencarian atau gunakan tombol "Scan Barcode / QR".',
        'Klik pada kartu nama tamu yang sesuai untuk membuka jendela detail tamu.',
        'Tekan tombol centang hijau "Verifikasi Hadir" untuk menandai kehadiran dan mencatat jam masuk real-time.',
        'Anda juga dapat mencetak kupon souvenir atau kartu ucapan langsung dari jendela detail tamu.',
      ],
      tips: 'Gunakan filter kategori (VIP, Keluarga, Reguler) untuk mempercepat pencarian rombongan keluarga besar.',
    },
    {
      id: 'guide-2',
      category: 'checkin',
      title: 'Registrasi Tamu Baru (Input On-The-Spot)',
      shortDesc: 'Menambahkan tamu yang belum terdaftar dalam undangan fisik sebelumnya.',
      icon: 'person_add',
      badge: 'Input Cepat',
      steps: [
        'Buka menu "Input Tamu" di navigasi utama.',
        'Isi Nama Lengkap Tamu, Asal / Instansi / Domisili, dan Kategori Tamu (VIP / Keluarga / Reguler).',
        'Pilih jumlah pax (orang) yang menyertai tamu tersebut.',
        'Jika tamu langsung menyerahkan amplop atau kado, centang kotak "Bawa Amplop" atau "Bawa Kado".',
        'Klik tombol "Simpan & Cetak Kupon" untuk langsung menyimpan ke database cloud.',
      ],
      tips: 'Sistem otomatis menghasilkan ID Tamu dan kode kupon unik untuk setiap tamu baru yang didaftarkan.',
    },
    {
      id: 'guide-3',
      category: 'amplop',
      title: 'Pencatatan Amplop Tunai, QRIS, dan Penitipan Kado',
      shortDesc: 'Dokumentasi akurat titipan amplop dan lokasi rak penyimpanan kado.',
      icon: 'payments',
      badge: 'Keuangan & Logistik',
      steps: [
        'Pada form Input Tamu atau jendela Edit Tamu, centang opsi "Bawa Amplop".',
        'Pilih metode amplop: Tunai, QRIS, atau Transfer Bank.',
        'Masukkan nominal angka (misal: Rp 500.000). Nominal otomatis terformat rapi.',
        'Jika membawa kado fisik, centang "Bawa Kado" lalu isi deskripsi kado serta Nomor Rak (contoh: Rak A-02 / Box VIP).',
        'Nomor rak kado akan mempermudah keluarga mengambil kado tamu saat resepsi selesai.',
      ],
      tips: 'Semua nominal amplop terhitung otomatis ke dalam Ringkasan Keuangan di menu Laporan & Rekap.',
    },
    {
      id: 'guide-4',
      category: 'souvenir',
      title: 'Penukaran Kupon Souvenir di Booth Souvenir',
      shortDesc: 'Validasi token kupon tamu agar satu tamu hanya mengambil satu jatah souvenir.',
      icon: 'featured_seasonal_and_gifts',
      badge: 'Booth Souvenir',
      steps: [
        'Buka menu "Kelola Souvenir" pada navigasi.',
        'Di panel "Penukaran Cepat", ketik ID Tamu, Nama Tamu, atau Kode Kupon (misal: SOUV-...).',
        'Petugas juga dapat menggunakan tombol "Scan Barcode / QR Kupon" menggunakan kamera tablet/laptop.',
        'Data tamu dan status kupon akan muncul. Jika kupon masih aktif, tekan tombol "Tukar Souvenir Sekarang".',
        'Status kupon akan berubah menjadi "Sudah Diambil" dengan catatan waktu pengambilan, dan sisa stok souvenir otomatis berkurang 1.',
      ],
      tips: 'Jika tamu mencoba menukar kupon untuk kedua kalinya, sistem akan mengeluarkan bunyi peringatan dan menolak penukaran ganda.',
    },
    {
      id: 'guide-5',
      category: 'multi-meja',
      title: 'Beralih Meja Resepsionis Cepat dengan Kode PIN',
      shortDesc: 'Menjalankan beberapa laptop/tablet meja resepsionis secara bersamaan.',
      icon: 'pin',
      badge: 'Operasional Meja',
      steps: [
        'Buka menu "Portal Admin & WO" (ikon profil akun di pojok kanan atas atau sidebar).',
        'Di bagian "Beralih Cepat Meja Resepsionis", masukkan salah satu kode PIN resmi:',
        'PIN 8821: Meja 1 (Pintu Utama Depan)',
        'PIN 8822: Meja 2 (Pintu Samping VIP)',
        'PIN 8823: Booth Souvenir (Meja Penukaran Kupon)',
        'PIN 9999: Meja Administrator Utama',
        'Tekan tombol "Verifikasi & Masuk". Sesi meja akan langsung aktif tanpa perlu login ulang akun Firebase.',
      ],
      tips: 'Setiap tamu yang dicheck-in akan otomatis mencatat nama meja petugas yang melayaninya.',
    },
    {
      id: 'guide-6',
      category: 'laporan',
      title: 'Ekspor Data Excel & Cetak Buku Tamu PDF',
      shortDesc: 'Membuat laporan formal pasca-acara untuk keluarga pengantin.',
      icon: 'print',
      badge: 'Pasca-Acara',
      steps: [
        'Buka menu "Laporan & Rekap" pada navigasi utama.',
        'Periksa rekapitulasi jumlah total kehadiran, perolehan amplop tunai, QRIS, dan kado fisik.',
        'Tekan tombol "Ekspor ke CSV / Excel" untuk mengunduh seluruh data tamu dalam bentuk lembar kerja.',
        'Tekan tombol "Cetak Laporan / Simpan PDF" untuk menghasilkan lembar rekap resmi siap tanda tangan panitia wedding.',
      ],
      tips: 'Laporan cetak dapat disimpan langsung sebagai file PDF berkualitas tinggi melalui dialog print browser.',
    },
  ];

  const filteredGuides = guides.filter((g) => {
    const matchCat = activeCategory === 'semua' || g.category === activeCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const faqs = [
    {
      q: 'Apakah data tamu tetap tersimpan jika koneksi internet di gedung terputus?',
      a: 'Ya! Google Firebase Firestore dilengkapi mekanisme caching lokal otomatis di peramban. Jika internet sempat terputus, data tetap tersimpan di perangkat lokal dan akan otomatis diunggah ke cloud begitu koneksi kembali tersambung.',
    },
    {
      q: 'Apakah akun saya bisa diakses bersamaan di beberapa tablet/laptop di meja berbeda?',
      a: 'Bisa! Anda cukup login dengan akun yang sama di semua perangkat meja resepsionis dan booth souvenir. Perubahan data kehadiran dan penukaran souvenir akan saling tersinkronisasi secara langsung (real-time).',
    },
    {
      q: 'Bagaimana jika ada tamu yang lupa membawa undangan atau tidak membawa kode QR?',
      a: 'Petugas cukup mengetik nama tamu pada kolom pencarian di menu Buku Tamu, atau jika belum terdaftar sama sekali, langsung daftarkan lewat menu Input Tamu dalam waktu kurang dari 30 detik.',
    },
    {
      q: 'Siapa yang dapat saya hubungi jika terjadi kendala teknis saat acara berlangsung?',
      a: 'Tim teknis microdata2r siap siaga mendampingi Anda melalui WhatsApp resmi di +6282186371356 atau email digitalserviceprint.io@gmail.com.',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 font-body animate-in fade-in">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white p-6 sm:p-8 shadow-xl shadow-orange-600/15 mb-8 border border-orange-400/30">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/20">
              <span className="material-symbols-outlined text-sm">support_agent</span>
              <span>Pusat Panduan &amp; Bantuan Pelanggan</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight">
              Bantuan &amp; Panduan Wedding Book
            </h1>
            <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
              Panduan lengkap operasional meja resepsionis, penukaran souvenir, pencatatan amplop, serta layanan kontak darurat resmi untuk kelancaran acara pernikahan Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('tentang-aplikasi')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">info</span>
              <span>Tentang Aplikasi &amp; v.1.02</span>
            </button>
          </div>
        </div>
      </div>

      {/* Direct Contact Cards (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
        
        {/* WhatsApp & Telepon Card */}
        <div className="glass-card bg-white/95 rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-md shadow-emerald-500/5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <span className="material-symbols-outlined text-2xl">call</span>
            </div>
            <div className="space-y-1 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-body">
                Layanan Cepat WhatsApp &amp; Telepon
              </span>
              <h2 className="font-headline text-base sm:text-lg font-bold text-stone-900 leading-tight">
                {contactPhone}
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Hubungi hotline teknisi kami untuk respon instan saat persiapan atau jalannya acara Hari-H resepsi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sound.playTap()}
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 text-center"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>Chat WhatsApp</span>
            </a>
            <a
              href={`tel:${contactPhone}`}
              onClick={() => sound.playTap()}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">phone_in_talk</span>
              <span>Panggil</span>
            </a>
            <button
              type="button"
              onClick={() => handleCopy(contactPhone, 'phone')}
              className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
              title="Salin Nomor Telepon"
            >
              <span className="material-symbols-outlined text-base">
                {copiedContact === 'phone' ? 'done' : 'content_copy'}
              </span>
              <span>{copiedContact === 'phone' ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {/* Email Support Card */}
        <div className="glass-card bg-white/95 rounded-3xl p-5 sm:p-6 border border-orange-200/80 shadow-md shadow-orange-500/5 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 font-body">
                Email Customer Support Resmi
              </span>
              <h2 className="font-headline text-base sm:text-lg font-bold text-stone-900 leading-tight truncate">
                {contactEmail}
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Kirim pertanyaan seputar lisensi, kustomisasi desain buku tamu, atau bantuan impor data tamu massal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-orange-100">
            <a
              href={`mailto:${contactEmail}?subject=Bantuan%20Aplikasi%20Wedding%20Book%20v1.02`}
              onClick={() => sound.playTap()}
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 text-center"
            >
              <span className="material-symbols-outlined text-base">outgoing_mail</span>
              <span>Kirim Email Langsung</span>
            </a>
            <button
              type="button"
              onClick={() => handleCopy(contactEmail, 'email')}
              className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
              title="Salin Alamat Email"
            >
              <span className="material-symbols-outlined text-base">
                {copiedContact === 'email' ? 'done' : 'content_copy'}
              </span>
              <span>{copiedContact === 'email' ? 'Tersalin' : 'Salin Email'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Guides Section */}
      <div className="space-y-6">
        
        {/* Section Header with Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">menu_book</span>
              Panduan Langkah demi Langkah
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Petunjuk operasional praktis untuk petugas meja resepsionis dan tim Wedding Organizer.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari petunjuk (misal: amplop, kupon)..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-orange-200/80 focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 outline-none text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          {[
            { id: 'semua', label: 'Semua Panduan' },
            { id: 'checkin', label: 'Check-In & Tamu' },
            { id: 'amplop', label: 'Amplop & Kado' },
            { id: 'souvenir', label: 'Booth Souvenir' },
            { id: 'multi-meja', label: 'Multi-Meja PIN' },
            { id: 'laporan', label: 'Laporan & Rekap' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playTap();
                setActiveCategory(cat.id);
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white hover:bg-orange-50 text-stone-700 border border-orange-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion / Cards List */}
        <div className="space-y-3.5">
          {filteredGuides.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-orange-200">
              <span className="material-symbols-outlined text-4xl text-stone-400 mb-2">search_off</span>
              <p className="font-bold text-stone-700 text-sm">Panduan Tidak Ditemukan</p>
              <p className="text-xs text-stone-500 mt-1">Coba gunakan kata kunci pencarian yang berbeda.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('semua');
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-800 text-xs font-bold"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            filteredGuides.map((guide, idx) => {
              const isExpanded = expandedGuideId === guide.id;
              return (
                <div
                  key={guide.id}
                  className="bg-white/95 rounded-2xl border border-orange-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setExpandedGuideId(isExpanded ? null : guide.id);
                    }}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-orange-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">{guide.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-stone-900">
                            {idx + 1}. {guide.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                            {guide.badge}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5 truncate max-w-xl">
                          {guide.shortDesc}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`material-symbols-outlined text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-180 text-orange-600' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-orange-100 bg-orange-50/20 space-y-4 animate-in fade-in">
                      <div className="space-y-2.5 pt-2">
                        <span className="text-xs font-bold text-stone-900 block">
                          Tahapan Operasional:
                        </span>
                        <div className="space-y-2">
                          {guide.steps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {guide.tips && (
                        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">
                            lightbulb
                          </span>
                          <span><strong>Tips Penting:</strong> {guide.tips}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Frequently Asked Questions (FAQ) */}
      <div className="mt-12 space-y-4">
        <h2 className="font-headline text-xl font-bold text-stone-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-600">quiz</span>
          Pertanyaan Umum (FAQ)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white/95 rounded-2xl p-5 border border-orange-200/70 shadow-2xs space-y-2"
            >
              <h3 className="font-bold text-xs sm:text-sm text-stone-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-orange-500 text-base shrink-0 mt-0.5">
                  help_outline
                </span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Support Card */}
      <div className="mt-10 p-6 rounded-3xl bg-gradient-to-r from-orange-100/70 via-amber-100/50 to-orange-100/70 border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <p className="font-bold text-stone-900 text-sm">
            Butuh Kustomisasi Khusus atau Dukungan On-Site?
          </p>
          <p className="text-xs text-stone-600">
            Tim developer <strong className="text-orange-950">microdata2r</strong> siap membantu penyesuaian format undangan, integrasi printer struk bluetooth, dan tata kelola buku tamu.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">headset_mic</span>
            <span>Hubungi microdata2r</span>
          </a>
        </div>
      </div>

    </div>
  );
};
