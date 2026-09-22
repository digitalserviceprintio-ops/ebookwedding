import React from 'react';
import { APP_ASSETS } from '../data/initialData';
import { UserSession, TabType } from '../types';

interface HeaderProps {
  session: UserSession;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAdminPortal: () => void;
  onOpenQRScan?: () => void;
  onOpenKiosk?: () => void;
  onToggleMobileMenu?: () => void;
  guestCount?: number;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string; icon: string }> = {
  'buku-tamu': {
    title: 'Buku Tamu Digital',
    subtitle: 'Daftar kehadiran resmi, amplop tunai/QRIS, dan kado',
    icon: 'menu_book',
  },
  'input-tamu': {
    title: 'Input & Check-In Tamu',
    subtitle: 'Pencatatan data kehadiran dan pembuatan kupon souvenir',
    icon: 'person_add',
  },
  'kelola-souvenir': {
    title: 'Kelola & Penukaran Souvenir',
    subtitle: 'Kontrol stok souvenir, verifikasi kupon token, dan log penukaran live',
    icon: 'featured_seasonal_and_gifts',
  },
  'galeri-wedding': {
    title: 'Galeri Foto Momen',
    subtitle: 'Dokumentasi visual kebahagiaan dan live photo booth',
    icon: 'photo_library',
  },
  'laporan-dan-cetak': {
    title: 'Laporan & Rekapitulasi',
    subtitle: 'Ringkasan amplop, ekspor data Excel, dan cetak laporan PDF',
    icon: 'summarize',
  },
  'akun-admin': {
    title: 'Portal Admin & Pengaturan',
    subtitle: 'Konfigurasi meja resepsionis, akun, dan manajemen database',
    icon: 'manage_accounts',
  },
  'panduan-bantuan': {
    title: 'Panduan & Bantuan',
    subtitle: 'Petunjuk lengkap sistem dan kontak bantuan resmi (+6282186371356)',
    icon: 'support_agent',
  },
  'tentang-aplikasi': {
    title: 'Tentang Aplikasi & Versi',
    subtitle: 'Aplikasi dikembangkan oleh microdata2r • wedding book v.1.02',
    icon: 'info',
  },
};

export const Header: React.FC<HeaderProps> = ({
  session,
  activeTab,
  setActiveTab,
  onOpenAdminPortal,
  onToggleMobileMenu,
  guestCount,
}) => {
  if (activeTab === 'akun-admin') {
    return null;
  }

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES['buku-tamu'];

  return (
    <header className="fixed top-0 inset-x-0 md:left-64 lg:left-72 z-30 bg-white/85 backdrop-blur-2xl shadow-[0_4px_20px_-2px_rgba(234,88,12,0.06)] border-b border-orange-100/80 transition-all">
      <div className="w-full h-16 md:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile View: Hamburger Menu + Logo Title */}
        <div className="flex md:hidden items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="w-10 h-10 rounded-xl bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 text-orange-950 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
            title="Buka Menu Navigasi"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <div
            onClick={() => setActiveTab('buku-tamu')}
            className="flex items-center gap-2 min-w-0 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-100 p-0.5 border border-orange-200 shrink-0">
              <img
                alt="Logo"
                className="w-full h-full object-contain"
                src={APP_ASSETS.logo}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-[14px] font-bold text-orange-950 truncate leading-tight">
                {session.weddingTitle || 'Kevin & Clarissa'}
              </span>
              <span className="font-body text-[10px] text-stone-500 truncate">
                {currentTabInfo.title}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View: Active Tab Breadcrumb & Title */}
        <div className="hidden md:flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-orange-500/20 border border-orange-200/80 flex items-center justify-center text-orange-700 shadow-2xs shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              {currentTabInfo.icon}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-[16px] lg:text-[18px] font-bold text-stone-900 tracking-tight leading-tight">
                {currentTabInfo.title}
              </h1>
              {activeTab === 'buku-tamu' && guestCount !== undefined && guestCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200 shadow-2xs">
                  {guestCount} Tamu Terdaftar
                </span>
              )}
            </div>
            <p className="font-body text-[11px] text-stone-500 truncate mt-0.5 max-w-xl">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions: Profile / Desk Info */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Kiosk Display Button */}
          {onOpenKiosk && (
            <button
              type="button"
              onClick={onOpenKiosk}
              title="Buka Layar Kiosk Interaktif & Slideshow Tamu"
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 ring-1 ring-amber-400/40 shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[19px] text-amber-400">tv</span>
              <span className="hidden sm:inline">Kiosk Display</span>
            </button>
          )}

          {/* Quick Help & Guide Button */}
          <button
            type="button"
            onClick={() => setActiveTab('panduan-bantuan')}
            title="Panduan Penggunaan & Bantuan (+6282186371356)"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              activeTab === 'panduan-bantuan'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white hover:bg-orange-50 text-stone-600 hover:text-orange-600 ring-1 ring-orange-200/80 shadow-2xs'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>

          {/* User Profile / Desk Switcher */}
          <button
            onClick={onOpenAdminPortal}
            title={`${session.name} (${session.deskName}) - Buka Akun / Admin Portal`}
            className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-2xl ring-1 ring-orange-200/90 hover:ring-orange-400 transition-all active:scale-95 bg-white/95 shadow-2xs hover:shadow-xs group"
          >
            <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-orange-200 group-hover:scale-105 transition-transform shrink-0">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={session.avatarUrl || APP_ASSETS.avatarReception}
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white"></span>
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-body text-[11.5px] sm:text-[12px] font-bold text-stone-900 group-hover:text-orange-600 transition-colors truncate max-w-[110px]">
                {session.name}
              </span>
              <span className="font-body text-[9.5px] sm:text-[10px] text-stone-500 truncate max-w-[110px]">
                {session.deskName || 'Admin / WO'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

