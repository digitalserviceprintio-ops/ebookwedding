import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  guestCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: 'buku-tamu' as TabType,
      label: 'Buku Tamu',
      icon: 'menu_book',
    },
    {
      id: 'input-tamu' as TabType,
      label: 'Input Tamu',
      icon: 'person_add',
    },
    {
      id: 'galeri-wedding' as TabType,
      label: 'Galeri',
      icon: 'photo_library',
    },
    {
      id: 'laporan-dan-cetak' as TabType,
      label: 'Laporan',
      icon: 'print',
    },
    {
      id: 'akun-admin' as TabType,
      label: 'Akun',
      icon: 'verified_user',
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-orange-100/80 shadow-[0_-4px_24px_rgba(234,88,12,0.08)] no-print md:hidden">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 transition-all active:scale-95 ${
                isActive
                  ? 'text-orange-600 font-bold'
                  : 'text-orange-950/60 hover:text-orange-900'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-7 h-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-xs shadow-orange-500/50"></span>
              )}
              <span
                className={`material-symbols-outlined text-2xl transition-transform ${
                  isActive ? 'scale-110 fill-1 text-orange-600' : 'text-stone-400'
                }`}
              >
                {tab.icon}
              </span>
              <span className={`font-body text-[10.5px] tracking-tight truncate max-w-[64px] ${isActive ? 'text-orange-600 font-bold' : 'text-stone-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
