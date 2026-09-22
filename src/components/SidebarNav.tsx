import React from 'react';
import { APP_ASSETS } from '../data/initialData';
import { UserSession, TabType } from '../types';

interface SidebarNavProps {
  session: UserSession;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  guestCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenAdminPortal: () => void;
  onOpenRSVP?: () => void;
  onLogout?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  session,
  activeTab,
  setActiveTab,
  guestCount,
  isOpenMobile,
  setIsOpenMobile,
  onOpenAdminPortal,
  onOpenRSVP,
  onLogout,
}) => {
  const mainNavItems: {
    id: TabType;
    label: string;
    sublabel: string;
    icon: string;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'buku-tamu',
      label: 'Buku Tamu',
      sublabel: 'Daftar kehadiran & amplop',
      icon: 'menu_book',
      badge: guestCount > 0 ? guestCount : undefined,
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      id: 'input-tamu',
      label: 'Input Tamu',
      sublabel: 'Check-in & cetak kupon',
      icon: 'person_add',
      badge: '+ Baru',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    },
    {
      id: 'kelola-souvenir',
      label: 'Kelola Souvenir',
      sublabel: 'Stok & kupon penukaran',
      icon: 'featured_seasonal_and_gifts',
      badge: 'Booth',
      badgeColor: 'bg-orange-100 text-orange-800 border border-orange-200',
    },
    {
      id: 'galeri-wedding',
      label: 'Galeri Foto',
      sublabel: 'Live photo booth tamu',
      icon: 'photo_library',
    },
    {
      id: 'laporan-dan-cetak',
      label: 'Laporan & Rekap',
      sublabel: 'Rekap amplop & cetak PDF',
      icon: 'summarize',
    },
  ];

  const secondaryNavItems: {
    id: TabType;
    label: string;
    sublabel: string;
    icon: string;
    badge?: string;
  }[] = [
    {
      id: 'akun-admin',
      label: 'Portal Admin & WO',
      sublabel: 'Profil akun & multi-meja',
      icon: 'manage_accounts',
    },
    {
      id: 'panduan-bantuan',
      label: 'Panduan & Bantuan',
      sublabel: 'Bantuan teknis & kontak',
      icon: 'support_agent',
    },
    {
      id: 'tentang-aplikasi',
      label: 'Tentang Aplikasi',
      sublabel: 'microdata2r • v.1.02',
      icon: 'info',
      badge: 'v.1.02',
    },
  ];

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsOpenMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Branding & Event Header */}
      <div>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-orange-100/80">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => handleSelectTab('buku-tamu')}
              className="flex items-center gap-3 cursor-pointer group min-w-0"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 shadow-md shadow-orange-500/25 shrink-0 transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
                  <img
                    alt="Logo"
                    className="w-full h-full object-contain"
                    src={APP_ASSETS.logo}
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline text-[15px] font-bold text-orange-950 group-hover:text-orange-600 transition-colors truncate leading-tight">
                  {session.weddingTitle || 'Kevin & Clarissa'}
                </span>
                <span className="font-body text-[11px] text-stone-500 truncate mt-0.5">
                  Buku Tamu Digital
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsOpenMobile(false)}
              className="md:hidden w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 flex items-center justify-center transition-colors"
              title="Tutup Menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Cloud Sync & Date Info Pill */}
          <div className="mt-3.5 pt-3 border-t border-orange-100/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-stone-600 font-medium">
              <span className="material-symbols-outlined text-[14px] text-orange-600">calendar_month</span>
              <span>{session.weddingDate || '20 Sep 2026'}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-3 sm:p-4 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-270px)]">
          {/* Main Navigation Section */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-orange-900/60 uppercase tracking-wider font-body">
                Menu Utama
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {mainNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-body text-left transition-all active:scale-[0.99] group ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 font-bold'
                        : 'text-stone-700 hover:text-orange-950 hover:bg-orange-50/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-orange-100/60 text-orange-700 group-hover:bg-orange-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {item.icon}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] leading-tight truncate">
                          {item.label}
                        </span>
                        <span
                          className={`text-[10.5px] truncate mt-0.5 ${
                            isActive ? 'text-white/80' : 'text-stone-400'
                          }`}
                        >
                          {item.sublabel}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ml-2 ${
                          isActive ? 'bg-white text-orange-700 shadow-2xs' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* System & Settings Section */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-orange-900/60 uppercase tracking-wider font-body">
                Sistem &amp; Pengaturan
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {secondaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-body text-left transition-all active:scale-[0.99] group ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 font-bold'
                        : 'text-stone-700 hover:text-orange-950 hover:bg-orange-50/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-orange-100/60 text-orange-700 group-hover:bg-orange-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {item.icon}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] leading-tight truncate">
                          {item.label}
                        </span>
                        <span
                          className={`text-[10.5px] truncate mt-0.5 ${
                            isActive ? 'text-white/80' : 'text-stone-400'
                          }`}
                        >
                          {item.sublabel}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Profile & Session Card */}
      <div className="p-3 sm:p-4 border-t border-orange-100/80 bg-white/60">
        <div className="p-2.5 rounded-2xl bg-white border border-orange-200/70 shadow-xs flex items-center justify-between gap-2.5">
          <div
            onClick={() => handleSelectTab('akun-admin')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 group"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1.5 ring-orange-300 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <img
                alt="Avatar"
                className="w-full h-full object-cover"
                src={session.avatarUrl || APP_ASSETS.avatarReception}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1 ring-white"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body text-[12.5px] font-bold text-stone-900 group-hover:text-orange-600 transition-colors truncate">
                {session.name}
              </span>
              <span className="font-body text-[10.5px] text-stone-500 truncate">
                {session.deskName || 'Petugas WO / Admin'}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar / Logout"
              className="w-8 h-8 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>

        {/* Developer & Version Badge Footer */}
        <div
          onClick={() => handleSelectTab('tentang-aplikasi')}
          className="mt-2 text-center cursor-pointer group py-0.5"
          title="Lihat Tentang Aplikasi wedding book v.1.02 oleh microdata2r"
        >
          <span className="text-[10.5px] text-stone-400 group-hover:text-orange-600 transition-colors font-body inline-flex items-center gap-1.5">
            <span className="font-semibold">wedding book v.1.02</span>
            <span className="text-stone-300">•</span>
            <span>oleh <strong className="font-bold text-stone-600 group-hover:text-orange-600">microdata2r</strong></span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Modern Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 fixed inset-y-0 left-0 z-40 bg-white/85 backdrop-blur-2xl border-r border-orange-100/90 shadow-[4px_0_24px_-4px_rgba(234,88,12,0.06)]">
        {navContent}
      </aside>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsOpenMobile(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white/95 backdrop-blur-2xl border-r border-orange-200/80 shadow-2xl z-10 flex flex-col animate-slide-in-left">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
