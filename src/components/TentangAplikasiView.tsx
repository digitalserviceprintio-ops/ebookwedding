import React from 'react';
import { TabType } from '../types';
import { APP_ASSETS } from '../data/initialData';
import { sound } from '../utils/sound';

interface TentangAplikasiViewProps {
  onNavigateToTab: (tab: TabType) => void;
}

export const TentangAplikasiView: React.FC<TentangAplikasiViewProps> = ({
  onNavigateToTab,
}) => {
  const appVersion = 'wedding book v.1.02';
  const developerName = 'microdata2r';
  const contactEmail = 'digitalserviceprint.io@gmail.com';
  const contactPhone = '+6282186371356';
  const waUrl = `https://wa.me/6282186371356?text=${encodeURIComponent(
    'Halo microdata2r, saya ingin berkonsultasi mengenai Wedding Book Digital v.1.02:'
  )}`;

  const changelog = [
    {
      version: 'v.1.02 (Rilis Terbaru)',
      date: 'September 2026',
      badge: 'Versi Saat Ini',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      highlights: [
        'Penambahan modul resmi "Kelola Souvenir" dengan penukaran cepat barcode kupon & pelacakan sisa stok otomatis.',
        'Pembaruan identitas resmi pengembang: microdata2r & rilis wedding book v.1.02.',
        'Penambahan Pusat Menu "Panduan & Bantuan" lengkap dengan kontak WhatsApp (+6282186371356) & Email Support.',
        'Penyempurnaan tema Glassmorphism modern berkecepatan tinggi dengan isolasi data Cloud Firestore per-akun.',
      ],
    },
    {
      version: 'v.1.01',
      date: 'Agustus 2026',
      badge: 'Stabil',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
      highlights: [
        'Fitur multi-meja resepsionis dengan tombol PIN cepat (Meja 1, Meja 2, Booth Souvenir, dan Admin).',
        'Pencatatan amplop digital (Tunai & QRIS) serta pengelompokan nomor rak kado fisik.',
        'Live Photo Booth galeri momen pernikahan dengan filter kategori dan penyematan foto utama.',
      ],
    },
    {
      version: 'v.1.00',
      date: 'Juli 2026',
      badge: 'Inisial',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
      highlights: [
        'Peluncuran perdana sistem Buku Tamu Digital dengan QR Scanner mandiri.',
        'Check-in tamu real-time dan ekspor laporan rekapitulasi data tamu ke lembar kerja Excel & cetak PDF.',
      ],
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 font-body animate-in fade-in">
      
      {/* Brand Hero Card */}
      <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-orange-200/90 shadow-xl shadow-orange-500/5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-400/10 via-amber-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Logo Badge */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-1 shadow-xl shadow-orange-500/25 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[20px] p-3 flex items-center justify-center">
              <img
                src={APP_ASSETS.logo}
                alt="Logo Wedding Book"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Info Titles */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                {appVersion}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Produksi Aktif
              </span>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              E-Book Wedding Digital
            </h1>

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Sistem buku tamu resepsionis pernikahan digital, manajemen amplop &amp; kado, barcode check-in mandiri, serta penukaran souvenir real-time yang dirancang khusus untuk kelancaran hari bahagia Anda.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-orange-600 text-base">code</span>
                <span>Dikembangkan oleh: <strong className="text-stone-900 font-bold">{developerName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-orange-600 text-base">verified</span>
                <span>Versi Resmi: <strong className="text-stone-900 font-bold">{appVersion}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playTap();
                onNavigateToTab('panduan-bantuan');
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">support_agent</span>
              <span>Buka Panduan &amp; Bantuan</span>
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sound.playTap()}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-orange-50 border border-orange-200 text-orange-950 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-emerald-600">chat</span>
              <span>Hubungi microdata2r</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Developer Profile & Technical Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Developer Profile Card */}
        <div className="bg-white/95 rounded-3xl p-6 border border-orange-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">developer_mode</span>
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-stone-900">
                Profil Pengembang Aplikasi
              </h2>
              <p className="text-[11px] text-stone-500">
                Pengembangan perangkat lunak &amp; solusi event digital
              </p>
            </div>
          </div>

          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/60 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200/50">
              <span className="text-stone-500">Nama Pengembang</span>
              <strong className="text-stone-900 font-bold text-sm">{developerName}</strong>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-orange-200/50">
              <span className="text-stone-500">Versi Rilis</span>
              <strong className="text-orange-700 font-bold">{appVersion}</strong>
            </div>
            <div className="flex flex-col gap-1 pb-2 border-b border-orange-200/50">
              <span className="text-stone-500">Email Resmi</span>
              <a
                href={`mailto:${contactEmail}`}
                className="font-semibold text-orange-600 hover:underline break-all"
              >
                {contactEmail}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">WhatsApp / Hotline</span>
              <a
                href={`tel:${contactPhone}`}
                className="font-bold text-emerald-700 hover:underline"
              >
                {contactPhone}
              </a>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Aplikasi dikembangkan oleh <strong>{developerName}</strong> untuk memberikan pengalaman resepsi modern, efisien, dan bebas antrean panjang bagi para pengantin dan Wedding Organizer di Indonesia.
          </p>
        </div>

        {/* Technical Architecture Card */}
        <div className="bg-white/95 rounded-3xl p-6 border border-orange-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">database</span>
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-stone-900">
                Arsitektur &amp; Keamanan Data
              </h2>
              <p className="text-[11px] text-stone-500">
                Penyimpanan cloud terenkripsi dan terisolasi
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-stone-700">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                lock
              </span>
              <div>
                <strong className="text-stone-900 block">Isolasi Data Akun (Multi-Tenant Secure)</strong>
                <span>Setiap akun memiliki direktori Firestore tersendiri. Data tamu pernikahan Anda 100% aman dan tidak dapat dilihat oleh pengguna lain.</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">
                sync
              </span>
              <div>
                <strong className="text-stone-900 block">Sinkronisasi Real-Time Multi-Device</strong>
                <span>Perubahan status tamu dan kupon souvenir otomatis terdistribusi ke seluruh meja resepsionis dalam hitungan milidetik.</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-orange-600 text-base shrink-0 mt-0.5">
                wifi_off
              </span>
              <div>
                <strong className="text-stone-900 block">Dukungan Cache Lokal (Offline Resilience)</strong>
                <span>Data tetap tersimpan aman di peramban saat sinyal internet di ballroom hotel melemah atau fluktuatif.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Changelog & History */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border border-orange-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-headline text-lg font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">history</span>
              Riwayat Rilis &amp; Catatan Pembaruan
            </h2>
            <p className="text-xs text-stone-500">
              Jejak pembaruan fitur aplikasi Wedding Book Digital
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {changelog.map((item, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-orange-50/30 border border-orange-200/70 space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-stone-900">{item.version}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 font-medium">{item.date}</span>
              </div>

              <ul className="space-y-1.5 pl-1">
                {item.highlights.map((point, pIdx) => (
                  <li key={pIdx} className="text-xs text-stone-700 flex items-start gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-sm shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="mt-8 text-center text-xs text-stone-400 space-y-1">
        <p>Aplikasi Wedding Book Digital • Versi {appVersion}</p>
        <p>© 2026 <strong>{developerName}</strong>. Seluruh hak cipta dilindungi undang-undang.</p>
      </div>

    </div>
  );
};
