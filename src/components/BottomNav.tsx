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
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#fbf8ff]/92 backdrop-blur-xl border-t border-[#e4e1ea]/60 shadow-[0_-2px_12px_rgba(119,90,25,0.06)] no-print">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 transition-all active:scale-95 ${
                isActive
                  ? 'text-[#775a19] font-bold'
                  : 'text-[#4e4639]/80 hover:text-[#1b1b21]'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-[#775a19]"></span>
              )}
              <span
                className={`material-symbols-outlined text-2xl transition-transform ${
                  isActive ? 'scale-110 fill-1 text-[#775a19]' : 'text-[#7f7667]'
                }`}
              >
                {tab.icon}
              </span>
              <span className="font-body text-[10.5px] tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
