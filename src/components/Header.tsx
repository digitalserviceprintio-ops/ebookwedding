import React from 'react';
import { APP_ASSETS } from '../data/initialData';
import { UserSession, TabType } from '../types';

interface HeaderProps {
  session: UserSession;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAdminPortal: () => void;
  onOpenQRScan?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeTab,
  setActiveTab,
  onOpenAdminPortal,
  onOpenQRScan,
}) => {
  if (activeTab === 'akun-admin') {
    return null; // The login/admin portal page has its own prominent centered card header
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#fbf8ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e4e1ea]/40">
      <div className="max-w-md mx-auto h-20 px-4 flex items-center justify-between gap-3">
        {/* Left: Logo & Event Title */}
        <div 
          onClick={() => setActiveTab('buku-tamu')}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none group"
        >
          <img
            alt="EBook Wedding Logo"
            className="h-9 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
            src={APP_ASSETS.logo}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-headline text-[17px] sm:text-[18px] font-semibold text-[#775a19] truncate leading-tight tracking-tight">
              {session.weddingTitle || 'The Wedding of Kevin & Clarissa'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-body text-[11px] font-medium text-[#7f7667] shrink-0">
                {session.weddingDate || '20 Sep 2026'}
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#d1c5b4]"></span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-body text-[10px] font-bold">
                <span className="material-symbols-outlined text-[11px] leading-none text-emerald-700">cloud_done</span>
                Permanen
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick QR Button & Receptionist / WO Profile button */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenQRScan && (
            <button
              onClick={onOpenQRScan}
              title="Tampilkan QR Meja Tamu (Form RSVP Mandiri)"
              className="w-10 h-10 rounded-full bg-[#ffdea5] hover:bg-[#775a19] text-[#261900] hover:text-white transition-all flex items-center justify-center shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[21px]">qr_code_2</span>
            </button>
          )}

          <button
            onClick={onOpenAdminPortal}
            title={`${session.name} (${session.deskName}) - Buka Akun / Admin Portal`}
            className="relative w-10 h-10 rounded-full ring-2 ring-[#c5a059]/40 hover:ring-[#c5a059] p-0.5 transition-all active:scale-95 bg-white shadow-sm flex items-center justify-center overflow-hidden"
          >
            <img
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
              src={session.avatarUrl || APP_ASSETS.avatarReception}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1.5 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
