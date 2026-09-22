import React, { useState, useMemo } from 'react';
import { Guest, SouvenirItem } from '../types';
import { INITIAL_SOUVENIRS } from '../data/initialData';
import { sound } from '../utils/sound';

interface KelolaSouvenirViewProps {
  guests: Guest[];
  onUpdateGuestSouvenir: (guestId: string, taken: boolean, souvenirItemId?: string) => void;
  onOpenQRScan?: () => void;
}

export const KelolaSouvenirView: React.FC<KelolaSouvenirViewProps> = ({
  guests,
  onUpdateGuestSouvenir,
  onOpenQRScan,
}) => {
  // Souvenir packages inventory state (with local storage persistence fallback)
  const [souvenirItems, setSouvenirItems] = useState<SouvenirItem[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('wedding_souvenir_items');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_SOUVENIRS;
  });

  const saveSouvenirItems = (items: SouvenirItem[]) => {
    setSouvenirItems(items);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('wedding_souvenir_items', JSON.stringify(items));
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'semua' | 'belum' | 'sudah' | 'VIP' | 'Keluarga'>('semua');
  const [activeTab, setActiveTab] = useState<'penukaran' | 'stok' | 'riwayat'>('penukaran');
  
  // Modal states
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SouvenirItem | null>(null);
  const [newPackage, setNewPackage] = useState<Partial<SouvenirItem>>({
    name: '',
    category: 'Reguler',
    totalStock: 100,
    description: '',
    icon: 'featured_seasonal_and_gifts',
    color: 'from-amber-500 to-orange-500',
  });

  // Quick Token Manual Input state
  const [quickTokenInput, setQuickTokenInput] = useState('');
  const [tokenFeedback, setTokenFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalGuests = guests.length;
    const takenGuests = guests.filter((g) => g.souvenirTaken);
    const totalTaken = takenGuests.length;
    const totalStock = souvenirItems.reduce((acc, item) => acc + (item.totalStock || 0), 0);
    const remainingStock = Math.max(0, totalStock - totalTaken);
    const percentage = totalStock > 0 ? Math.min(100, Math.round((totalTaken / totalStock) * 100)) : 0;
    
    // Category breakdowns
    const vipTaken = guests.filter((g) => g.category === 'VIP' && g.souvenirTaken).length;
    const regularTaken = guests.filter((g) => g.category === 'Reguler' && g.souvenirTaken).length;
    const keluargaTaken = guests.filter((g) => g.category === 'Keluarga' && g.souvenirTaken).length;

    return {
      totalGuests,
      totalTaken,
      totalStock,
      remainingStock,
      percentage,
      vipTaken,
      regularTaken,
      keluargaTaken,
    };
  }, [guests, souvenirItems]);

  // Filtered guest list for redemption table
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // Search matches name, origin, phone, or coupon token (#SOUV-xxx)
      const token = `#SOUV-${g.id.toUpperCase()}`;
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        g.name.toLowerCase().includes(search) ||
        g.origin.toLowerCase().includes(search) ||
        g.id.toLowerCase().includes(search) ||
        token.toLowerCase().includes(search) ||
        (g.phone && g.phone.includes(search));

      if (!matchSearch) return false;

      if (filterCategory === 'belum') return !g.souvenirTaken;
      if (filterCategory === 'sudah') return Boolean(g.souvenirTaken);
      if (filterCategory === 'VIP') return g.category === 'VIP';
      if (filterCategory === 'Keluarga') return g.category === 'Keluarga';

      return true;
    });
  }, [guests, searchQuery, filterCategory]);

  // Redemption log: recent redemptions
  const recentRedemptions = useMemo(() => {
    return guests
      .filter((g) => g.souvenirTaken && g.souvenirTakenAt)
      .sort((a, b) => (b.souvenirTakenAt || 0) - (a.souvenirTakenAt || 0))
      .slice(0, 15);
  }, [guests]);

  // Quick redeem handler
  const handleRedeemToggle = (guest: Guest) => {
    const isNowTaken = !guest.souvenirTaken;
    if (isNowTaken) {
      sound.playSuccess();
    } else {
      sound.playTap();
    }
    
    // Choose appropriate souvenir package based on guest category
    let matchedPackage = souvenirItems.find((s) => s.category === guest.category);
    if (!matchedPackage) {
      matchedPackage = souvenirItems.find((s) => s.category === 'Reguler') || souvenirItems[0];
    }

    onUpdateGuestSouvenir(guest.id, isNowTaken, matchedPackage?.id);
  };

  // Process Quick Token Input
  const handleProcessToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTokenInput.trim()) return;

    // Extract ID (supports "#SOUV-G-001", "SOUV-G-001", or "g-001")
    let cleaned = quickTokenInput.trim().toUpperCase();
    if (cleaned.startsWith('#')) cleaned = cleaned.substring(1);
    if (cleaned.startsWith('SOUV-')) cleaned = cleaned.replace('SOUV-', '');
    cleaned = cleaned.toLowerCase();

    const targetGuest = guests.find((g) => g.id.toLowerCase() === cleaned || g.name.toLowerCase() === cleaned);

    if (!targetGuest) {
      sound.playError();
      setTokenFeedback({
        type: 'error',
        message: `Kupon "${quickTokenInput}" tidak ditemukan dalam daftar tamu hadir.`,
      });
      return;
    }

    if (targetGuest.souvenirTaken) {
      sound.playTap();
      setTokenFeedback({
        type: 'error',
        message: `Kupon tamu ${targetGuest.name} SUDAH PERNAH DITUKAR sebelumnya.`,
      });
    } else {
      sound.playSuccess();
      handleRedeemToggle(targetGuest);
      setTokenFeedback({
        type: 'success',
        message: `Berhasil menukar souvenir untuk ${targetGuest.name} (${targetGuest.category})!`,
      });
    }

    setQuickTokenInput('');
    setTimeout(() => {
      setTokenFeedback(null);
    }, 4500);
  };

  // Save new or edited package
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.name?.trim()) return;

    if (editingItem) {
      const updated = souvenirItems.map((item) =>
        item.id === editingItem.id ? ({ ...item, ...newPackage } as SouvenirItem) : item
      );
      saveSouvenirItems(updated);
    } else {
      const newItem: SouvenirItem = {
        id: `souv-${Date.now()}`,
        name: newPackage.name.trim(),
        category: (newPackage.category as any) || 'Reguler',
        totalStock: Number(newPackage.totalStock) || 50,
        description: newPackage.description || '',
        icon: newPackage.icon || 'featured_seasonal_and_gifts',
        color: newPackage.color || 'from-orange-500 to-amber-500',
      };
      saveSouvenirItems([...souvenirItems, newItem]);
    }

    setIsAddPackageModalOpen(false);
    setEditingItem(null);
    setNewPackage({
      name: '',
      category: 'Reguler',
      totalStock: 100,
      description: '',
      icon: 'featured_seasonal_and_gifts',
      color: 'from-amber-500 to-orange-500',
    });
    sound.playSuccess();
  };

  // Adjust item stock directly
  const handleAdjustStock = (itemId: string, delta: number) => {
    sound.playTap();
    const updated = souvenirItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, totalStock: Math.max(0, item.totalStock + delta) };
      }
      return item;
    });
    saveSouvenirItems(updated);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Title Area */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-4 sm:p-6 border border-white/95 shadow-sm">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/15 blur-2xl pointer-events-none animate-ambient-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">featured_seasonal_and_gifts</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline text-[18px] sm:text-[22px] font-bold text-stone-900 leading-tight">
                  Manajemen &amp; Penukaran Souvenir
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100/90 text-orange-800 text-[10.5px] font-extrabold border border-orange-200 shadow-2xs">
                  Live Booth
                </span>
              </div>
              <p className="font-body text-[12px] sm:text-[13px] text-stone-500 mt-0.5">
                Kontrol stok paket souvenir pernikahan, verifikasi kupon tamu, dan riwayat penukaran real-time.
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenQRScan && (
              <button
                onClick={() => {
                  sound.playTap();
                  onOpenQRScan();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 border border-orange-200 text-orange-800 text-xs font-bold hover:bg-orange-50 shadow-2xs transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                <span>Scan QR Tamu</span>
              </button>
            )}
            <button
              onClick={() => {
                sound.playTap();
                setEditingItem(null);
                setNewPackage({
                  name: '',
                  category: 'Reguler',
                  totalStock: 100,
                  description: '',
                  icon: 'featured_seasonal_and_gifts',
                  color: 'from-amber-500 to-orange-500',
                });
                setIsAddPackageModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-citrus-primary text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add_box</span>
              <span>+ Paket Souvenir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Glassmorphism Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {/* Card 1: Total Stok */}
        <div className="glass-metric-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl">
          <div className="glass-sheen" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/85 ring-1 ring-orange-200/60 shadow-2xs flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <span className="font-body text-[10.5px] font-bold text-orange-800 bg-orange-100/90 px-2 py-0.5 rounded-full border border-orange-200/70">
              {souvenirItems.length} Paket
            </span>
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <span className="font-headline text-[22px] sm:text-[28px] font-extrabold text-stone-900 block leading-tight">
              {stats.totalStock.toLocaleString('id-ID')}
            </span>
            <span className="font-body text-[11.5px] sm:text-[12.5px] text-orange-950/75 truncate block mt-0.5 font-medium">
              Total Alokasi Stok
            </span>
          </div>
        </div>

        {/* Card 2: Sudah Ditukar */}
        <div className="glass-metric-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl">
          <div className="glass-sheen" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/85 ring-1 ring-emerald-200/60 shadow-2xs flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <span className="font-body text-[10.5px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/70">
              {stats.percentage}% Ditukar
            </span>
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <span className="font-headline text-[22px] sm:text-[28px] font-extrabold text-stone-900 block leading-tight">
              {stats.totalTaken.toLocaleString('id-ID')}
            </span>
            <span className="font-body text-[11.5px] sm:text-[12.5px] text-orange-950/75 truncate block mt-0.5 font-medium">
              Souvenir Diserahkan
            </span>
          </div>
        </div>

        {/* Card 3: Sisa Stok Tersedia */}
        <div className="glass-metric-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl">
          <div className="glass-sheen" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/85 ring-1 ring-amber-200/60 shadow-2xs flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">shelves</span>
            </div>
            <span className="font-body text-[10.5px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/70">
              Sisa Booth
            </span>
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <span className="font-headline text-[22px] sm:text-[28px] font-extrabold text-stone-900 block leading-tight">
              {stats.remainingStock.toLocaleString('id-ID')}
            </span>
            <span className="font-body text-[11.5px] sm:text-[12.5px] text-orange-950/75 truncate block mt-0.5 font-medium">
              Sisa Stok Tersedia
            </span>
          </div>
        </div>

        {/* Card 4: Antrean Belum Ambil */}
        <div className="glass-metric-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl">
          <div className="glass-sheen" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/85 ring-1 ring-purple-200/60 shadow-2xs flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">confirmation_number</span>
            </div>
            <span className="font-body text-[10.5px] font-bold text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded-full border border-purple-200/70">
              {stats.totalGuests - stats.totalTaken} Kupon
            </span>
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <span className="font-headline text-[22px] sm:text-[28px] font-extrabold text-stone-900 block leading-tight">
              {Math.max(0, stats.totalGuests - stats.totalTaken)}
            </span>
            <span className="font-body text-[11.5px] sm:text-[12.5px] text-orange-950/75 truncate block mt-0.5 font-medium">
              Tamu Belum Menukar
            </span>
          </div>
        </div>
      </div>

      {/* Quick Token Redemption Input Form */}
      <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-white/90 shadow-xs">
        <form onSubmit={handleProcessToken} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
            <div className="flex flex-col">
              <span className="font-headline text-[13px] font-bold text-orange-950 leading-tight">
                Validasi Token / Kode Kupon
              </span>
              <span className="text-[11px] text-stone-500">
                Ketik ID (#SOUV-G-001) atau Nama Tamu
              </span>
            </div>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={quickTokenInput}
              onChange={(e) => setQuickTokenInput(e.target.value)}
              placeholder="Contoh: #SOUV-G-001 atau nama tamu..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/95 border border-orange-200/90 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 shadow-inner"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-stone-400 text-[18px]">
              search
            </span>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl btn-citrus-primary text-xs font-bold shadow-xs whitespace-nowrap active:scale-95 transition-transform flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span>Verifikasi &amp; Tukar</span>
          </button>
        </form>

        {tokenFeedback && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              tokenFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tokenFeedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{tokenFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Main Tab Navigation inside Kelola Souvenir */}
      <div className="flex items-center justify-between border-b border-orange-200/60 pb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('penukaran');
            }}
            className={`px-4 py-2 rounded-xl font-body text-xs sm:text-[13px] font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'penukaran'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-700 hover:bg-orange-50 border border-orange-200/70'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">how_to_reg</span>
            <span>Daftar Kupon &amp; Penukaran ({filteredGuests.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('stok');
            }}
            className={`px-4 py-2 rounded-xl font-body text-xs sm:text-[13px] font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stok'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-700 hover:bg-orange-50 border border-orange-200/70'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">inventory</span>
            <span>Katalog &amp; Stok Paket ({souvenirItems.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('riwayat');
            }}
            className={`px-4 py-2 rounded-xl font-body text-xs sm:text-[13px] font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white/80 text-stone-700 hover:bg-orange-50 border border-orange-200/70'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">history</span>
            <span>Riwayat Live ({recentRedemptions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Penukaran Kupon Tamu */}
      {activeTab === 'penukaran' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, token #SOUV, atau asal..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 border border-orange-200 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 shadow-xs"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-stone-400 text-[18px]">
                search
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'semua', label: 'Semua Tamu' },
                { id: 'belum', label: 'Belum Ambil' },
                { id: 'sudah', label: 'Sudah Ambil' },
                { id: 'VIP', label: 'Tamu VIP' },
                { id: 'Keluarga', label: 'Keluarga' },
              ].map((pill) => {
                const isActive = filterCategory === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      sound.playTap();
                      setFilterCategory(pill.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'btn-citrus-primary shadow-xs'
                        : 'bg-white/85 text-stone-700 hover:bg-orange-50 border border-orange-200/70'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table of Guests for Souvenir Redemption */}
          {filteredGuests.length === 0 ? (
            <div className="p-10 rounded-2xl glass-panel text-center space-y-2 border border-orange-200/70">
              <span className="material-symbols-outlined text-4xl text-orange-400">search_off</span>
              <p className="font-headline font-bold text-stone-800 text-sm">Tidak ada tamu yang cocok</p>
              <p className="text-xs text-stone-500">Coba ubah kata kunci pencarian atau ganti filter kategori di atas.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/95 shadow-md backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px] md:min-w-full">
                  <thead>
                    <tr className="border-b border-orange-200/80 bg-orange-50/70 font-body text-[11px] font-bold text-orange-950 uppercase tracking-wider">
                      <th className="py-3 px-4">Kupon Token</th>
                      <th className="py-3 px-4">Nama Tamu &amp; Asal</th>
                      <th className="py-3 px-4">Kategori Tamu</th>
                      <th className="py-3 px-4">Paket Souvenir</th>
                      <th className="py-3 px-4">Status &amp; Waktu</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100/70 text-xs font-body">
                    {filteredGuests.map((guest) => {
                      const isTaken = Boolean(guest.souvenirTaken);
                      const matchedItem =
                        souvenirItems.find((s) => s.category === guest.category) ||
                        souvenirItems.find((s) => s.category === 'Reguler') ||
                        souvenirItems[0];

                      return (
                        <tr
                          key={guest.id}
                          className={`hover:bg-orange-50/50 transition-colors ${
                            isTaken ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Token Code */}
                          <td className="py-3 px-4 font-mono font-bold text-orange-700 whitespace-nowrap">
                            #SOUV-{guest.id.toUpperCase()}
                          </td>

                          {/* Guest Name & Origin */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">{guest.name}</div>
                            <div className="text-[11px] text-stone-500">{guest.origin}</div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                                guest.category === 'VIP'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : guest.category === 'Keluarga'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-orange-100 text-orange-800 border-orange-200'
                              }`}
                            >
                              {guest.category}
                            </span>
                          </td>

                          {/* Allocated Souvenir Package */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-medium text-stone-800">
                              <span className="material-symbols-outlined text-[15px] text-orange-600">
                                {matchedItem?.icon || 'redeem'}
                              </span>
                              <span className="truncate max-w-[180px]">{matchedItem?.name || 'Paket Souvenir'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isTaken ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                <span>Sudah Diambil</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200">
                                <span className="material-symbols-outlined text-[13px]">pending</span>
                                <span>Belum Ditukar</span>
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-center">
                            {isTaken ? (
                              <button
                                onClick={() => handleRedeemToggle(guest)}
                                title="Batalkan pengambilan souvenir jika keliru"
                                className="px-3 py-1 rounded-xl text-[11px] font-bold text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Batalkan
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRedeemToggle(guest)}
                                className="px-3.5 py-1.5 rounded-xl btn-citrus-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 mx-auto"
                              >
                                <span className="material-symbols-outlined text-[15px]">redeem</span>
                                <span>Tukar Souvenir</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Katalog & Stok Paket Souvenir */}
      {activeTab === 'stok' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {souvenirItems.map((item) => {
              // Count redeemed for this item or category
              const redeemedCount = guests.filter(
                (g) => g.souvenirTaken && (g.souvenirItemId === item.id || g.category === item.category)
              ).length;
              const remaining = Math.max(0, item.totalStock - redeemedCount);
              const percent = item.totalStock > 0 ? Math.round((redeemedCount / item.totalStock) * 100) : 0;
              const isLowStock = remaining <= item.totalStock * 0.15;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl glass-panel p-5 border border-white/95 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-orange-300 transition-all"
                >
                  <div className="space-y-3">
                    {/* Header item */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-2xs">
                          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-stone-900 text-sm leading-tight">
                            {item.name}
                          </h4>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
                            Khusus: {item.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNewPackage({ ...item });
                          setIsAddPackageModalOpen(true);
                        }}
                        className="text-stone-400 hover:text-orange-600 p-1 rounded-lg hover:bg-orange-50 transition-colors"
                        title="Edit Paket"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                    </div>

                    <p className="font-body text-xs text-stone-500 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Stock Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-orange-100">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-stone-600">Diserahkan: {redeemedCount} pcs</span>
                        <span className={isLowStock ? 'text-rose-600' : 'text-emerald-700'}>
                          Sisa: {remaining} pcs
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLowStock ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-400 to-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock Quick Adjustment Buttons */}
                  <div className="mt-4 pt-3 border-t border-orange-100/80 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-medium">Koreksi Stok:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustStock(item.id, -10)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:border-orange-300 text-stone-700 text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
                        title="Kurangi 10"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:border-orange-300 text-stone-700 text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
                        title="Kurangi 1"
                      >
                        -1
                      </button>
                      <span className="font-headline font-bold text-xs px-1 text-stone-800">
                        {item.totalStock}
                      </span>
                      <button
                        onClick={() => handleAdjustStock(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:border-orange-300 text-stone-700 text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
                        title="Tambah 1"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item.id, 10)}
                        className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-800 text-xs font-bold flex items-center justify-center transition-colors shadow-2xs"
                        title="Tambah 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Riwayat Penukaran Live */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          <div className="rounded-2xl glass-panel p-4 border border-white/90">
            <h4 className="font-headline font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 text-lg">history_toggle_drop_down</span>
              <span>Aktivitas Penukaran Souvenir Terakhir</span>
            </h4>

            {recentRedemptions.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                Belum ada souvenir yang diserahkan dalam sesi ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRedemptions.map((guest, idx) => {
                  const matched = souvenirItems.find((s) => s.category === guest.category) || souvenirItems[0];
                  const timeFormatted = guest.souvenirTakenAt
                    ? new Date(guest.souvenirTakenAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) + ' WIB'
                    : guest.time;

                  return (
                    <div
                      key={guest.id + idx}
                      className="p-3 rounded-xl bg-white/90 border border-orange-100 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px]">redeem</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate">{guest.name}</p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {matched.name} • {guest.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[10.5px]">
                          {timeFormatted}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Paket Souvenir */}
      {isAddPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-orange-100 space-y-4">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="font-headline text-lg font-bold text-stone-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">redeem</span>
                <span>{editingItem ? 'Edit Paket Souvenir' : 'Tambah Paket Souvenir Baru'}</span>
              </h3>
              <button
                onClick={() => setIsAddPackageModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5 text-xs font-body">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Paket Souvenir</label>
                <input
                  type="text"
                  required
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="Contoh: Aroma Diffuser Eksklusif"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-stone-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Kategori</label>
                  <select
                    value={newPackage.category}
                    onChange={(e) => setNewPackage({ ...newPackage, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-stone-900 font-semibold"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="VIP">VIP</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Semua">Semua Tamu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Total Stok (pcs)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPackage.totalStock}
                    onChange={(e) => setNewPackage({ ...newPackage, totalStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-stone-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi Paket</label>
                <textarea
                  rows={2}
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  placeholder="Keterangan isi souvenir atau petunjuk booth..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-stone-900 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-citrus-primary font-bold shadow-xs active:scale-95 transition-transform"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
