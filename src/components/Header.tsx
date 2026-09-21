import React from 'react';
import { APP_ASSETS } from '../data/initialData';
import { UserSession, TabType } from '../types';

interface HeaderProps {
  session: UserSession;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAdminPortal: () => void;
  onOpenQRScan?: () => void;
  particlesEnabled?: boolean;
  onToggleParticles?: () => void;
  guestCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeTab,
  setActiveTab,
  onOpenAdminPortal,
  onOpenQRScan,
  particlesEnabled = true,
  onToggleParticles,
  guestCount,
}) => {
  if (activeTab === 'akun-admin') {
    return null; // The login/admin portal page has its own prominent centered card header
  }

  const desktopNavItems: { id: TabType; label: string; icon: string; badge?: string | number }[] = [
    { id: 'buku-tamu', label: 'Buku Tamu', icon: 'menu_book', badge: guestCount !== undefined ? `${guestCount}` : undefined },
    { id: 'input-tamu', label: '+ Input Tamu', icon: 'person_add' },
    { id: 'galeri-wedding', label: 'Galeri Foto', icon: 'photo_library' },
    { id: 'laporan-dan-cetak', label: 'Laporan & Rekap', icon: 'summarize' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/85 backdrop-blur-2xl shadow-[0_4px_24px_-2px_rgba(234,88,12,0.08)] border-b border-orange-100/80 transition-all">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Logo & Event Title */}
        <div 
          onClick={() => setActiveTab('buku-tamu')}
          className="flex items-center gap-3 min-w-0 cursor-pointer select-none group shrink-0"
        >
          <div className="p-1.5 rounded-2xl bg-gradient-to-br from-orange-400/20 to-orange-500/10 border border-orange-200/70 shadow-xs shrink-0 transition-transform group-hover:scale-105">
            <img
              alt="EBook Wedding Logo"
              className="h-8 sm:h-9 w-auto object-contain"
              src={APP_ASSETS.logo}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline text-[16px] sm:text-[18px] lg:text-[19px] font-bold text-[#c2410c] truncate leading-tight tracking-tight group-hover:text-orange-600 transition-colors">
              {session.weddingTitle || 'The Wedding of Kevin & Clarissa'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-body text-[11px] font-semibold text-orange-900/70 shrink-0">
                {session.weddingDate || '20 Sep 2026'}
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-orange-300"></span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-body text-[10px] font-bold shadow-2xs">
                <span className="material-symbols-outlined text-[11px] leading-none text-emerald-600">cloud_done</span>
                Firebase Cloud Sync
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (md:flex) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-orange-100/50 p-1.5 rounded-2xl border border-orange-200/60 shadow-2xs backdrop-blur-md">
          {desktopNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-xl font-body text-[12.5px] lg:text-[13px] font-semibold transition-all active:scale-95 ${
                  isActive
                    ? 'btn-citrus-primary shadow-xs'
                    : 'text-stone-700 hover:text-orange-950 hover:bg-white/70'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] leading-none">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                      isActive ? 'bg-orange-800/60 text-white' : 'bg-orange-200/80 text-orange-900'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Particle Toggle, Quick QR Button & Receptionist / WO Profile button */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleParticles && (
            <button
              type="button"
              onClick={onToggleParticles}
              title={particlesEnabled ? 'Efek Bunga & Salju: Aktif (Klik matikan)' : 'Efek Bunga & Salju: Mati (Klik aktifkan)'}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border transition-all flex items-center justify-center shadow-xs active:scale-95 ${
                particlesEnabled
                  ? 'bg-orange-50 text-orange-600 border-orange-300 ring-2 ring-orange-400/20'
                  : 'bg-white/80 text-gray-400 border-gray-200 hover:text-orange-500'
              }`}
            >
              <span className="text-[14px] sm:text-[15px]">🌸</span>
            </button>
          )}

          {onOpenQRScan && (
            <button
              onClick={onOpenQRScan}
              title="Tampilkan QR Meja Tamu (Form RSVP Mandiri)"
              className="h-9 sm:h-10 px-3 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 font-body text-[12px] font-bold"
            >
              <span className="material-symbols-outlined text-[19px]">qr_code_2</span>
              <span className="hidden lg:inline">QR Tamu</span>
            </button>
          )}

          {/* User Profile / Desk Switcher */}
          <button
            onClick={onOpenAdminPortal}
            title={`${session.name} (${session.deskName}) - Buka Akun / Admin Portal`}
            className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-2xl ring-1.5 ring-orange-200 hover:ring-orange-400 transition-all active:scale-95 bg-white/90 shadow-2xs hover:shadow-xs group"
          >
            <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-orange-200 group-hover:scale-105 transition-transform">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={session.avatarUrl || APP_ASSETS.avatarReception}
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white"></span>
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="font-body text-[12px] font-bold text-stone-900 group-hover:text-orange-600 transition-colors truncate max-w-[110px]">
                {session.name}
              </span>
              <span className="font-body text-[10px] text-stone-500 truncate max-w-[110px]">
                {session.deskName || 'Resepsionis'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
