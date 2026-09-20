export type Gender = 'pria' | 'wanita';

export type EnvelopeMethod = 'tunai' | 'qris' | 'transfer';

export type GuestCategory = 'VIP' | 'Keluarga' | 'Reguler' | 'Vendor';

export interface Guest {
  id: string;
  userId?: string;
  name: string;
  gender: Gender;
  origin: string;
  category: GuestCategory;
  time: string;
  timestamp: number;
  hasEnvelope: boolean;
  envelopeNominal?: number;
  envelopeMethod?: EnvelopeMethod;
  hasGift: boolean;
  giftDescription?: string;
  giftShelf?: string;
  prayerWish?: string;
  checkedInBy: string;
  isVerified: boolean;
  paxCount?: number;
}

export interface GalleryPhoto {
  id: string;
  userId?: string;
  title: string;
  category: 'Akad & Resepsi' | 'Tamu & Photobooth' | 'Dekorasi Venue' | 'Semua Foto';
  time: string;
  location: string;
  url: string;
  tags: string[];
  likes: number;
  isPinned?: boolean;
  resolution?: string;
  authorRole?: string;
  timestamp?: number;
}

export type TabType = 'buku-tamu' | 'input-tamu' | 'galeri-wedding' | 'laporan-dan-cetak' | 'akun-admin';

export type UserRole = 'admin' | 'reception';

export interface UserSession {
  uid?: string;
  email: string;
  role: UserRole;
  deskName: string;
  name: string;
  isAuthenticated: boolean;
  avatarUrl: string;
  weddingTitle?: string;
  weddingDate?: string;
}
