import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Guest, GalleryPhoto, TabType, UserSession } from './types';
import { INITIAL_GUESTS, INITIAL_PHOTOS, INITIAL_SESSION } from './data/initialData';
import { 
  auth, 
  testFirestoreConnection, 
  subscribeUserGuests, 
  saveUserGuest, 
  removeUserGuest, 
  subscribeUserPhotos, 
  saveUserPhoto, 
  removeUserPhoto, 
  submitPublicRSVP,
  logoutUser 
} from './lib/firebase';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { BottomNav } from './components/BottomNav';
import { BukuTamuView } from './components/BukuTamuView';
import { InputTamuView } from './components/InputTamuView';
import { KelolaSouvenirView } from './components/KelolaSouvenirView';
import { GaleriView } from './components/GaleriView';
import { LaporanView } from './components/LaporanView';
import { AdminPortalView } from './components/AdminPortalView';
import { PanduanBantuanView } from './components/PanduanBantuanView';
import { TentangAplikasiView } from './components/TentangAplikasiView';
import { QRScanModal } from './components/QRScanModal';
import { GuestDetailModal } from './components/GuestDetailModal';
import { RSVPModal } from './components/RSVPModal';
import { KioskDisplayModal } from './components/KioskDisplayModal';
import { AuthView } from './components/AuthView';
import { FallingParticles } from './components/FallingParticles';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('buku-tamu');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [particlesEnabled, setParticlesEnabled] = useState(false);

  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('ebook_wedding_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'admin.wedding@organizer.com' || parsed.email === 'receptionist.desk@organizer.com') {
          parsed.email = '';
        }
        return parsed;
      }
      return INITIAL_SESSION;
    } catch {
      return INITIAL_SESSION;
    }
  });

  const [guests, setGuests] = useState<Guest[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  const [isQRScanOpen, setIsQRScanOpen] = useState(false);
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [prefillGuest, setPrefillGuest] = useState<Partial<Guest> | null>(null);

  // Auto-detect mobile camera QR scan (?mode=rsvp or ?rsvp=true or #rsvp)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('mode') === 'rsvp' ||
        urlParams.get('rsvp') === 'true' ||
        window.location.hash === '#rsvp'
      ) {
        setIsRSVPOpen(true);
      }
    }
  }, []);

  // Check Firestore connection & listen for Firebase Auth state
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);

      if (user) {
        setSession((prev) => {
          const updated: UserSession = {
            ...prev,
            uid: user.uid,
            email: user.email || prev.email || '',
            name: user.displayName || user.email?.split('@')[0] || prev.name || 'Pengguna Terdaftar',
            isAuthenticated: true,
          };
          try {
            localStorage.setItem('ebook_wedding_session', JSON.stringify(updated));
          } catch (e) {
            console.error('Failed to persist session:', e);
          }
          return updated;
        });
      } else {
        setSession((prev) => ({
          ...prev,
          uid: undefined,
          isAuthenticated: false,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to per-user isolated data in Firestore
  useEffect(() => {
    if (!firebaseUser) {
      setGuests([]);
      setPhotos([]);
      return;
    }

    const userId = firebaseUser.uid;
    let seededGuests = false;
    let seededPhotos = false;

    // Realtime listener for this user's guests
    const unsubGuests = subscribeUserGuests(
      userId,
      (cloudGuests) => {
        if (cloudGuests.length === 0 && !seededGuests) {
          seededGuests = true;
          // Seed with initial demo guests for this user so dashboard has ready-to-test data
          INITIAL_GUESTS.forEach((g) => {
            saveUserGuest(userId, { ...g, userId });
          });
        } else {
          setGuests(cloudGuests);
        }
      },
      (err) => {
        console.error('Failed to subscribe guests:', err);
      }
    );

    // Realtime listener for this user's gallery photos
    const unsubPhotos = subscribeUserPhotos(
      userId,
      (cloudPhotos) => {
        if (cloudPhotos.length === 0 && !seededPhotos) {
          seededPhotos = true;
          INITIAL_PHOTOS.forEach((p) => {
            saveUserPhoto(userId, { ...p, userId });
          });
        } else {
          setPhotos(cloudPhotos);
        }
      },
      (err) => {
        console.error('Failed to subscribe photos:', err);
      }
    );

    return () => {
      unsubGuests();
      unsubPhotos();
    };
  }, [firebaseUser]);

  // Guest CRUD Operations (Permanently persisted in Firestore)
  const handleGuestCreated = async (newGuest: Guest) => {
    setPrefillGuest(null);
    if (firebaseUser) {
      await saveUserGuest(firebaseUser.uid, { ...newGuest, userId: firebaseUser.uid });
    } else {
      setGuests((prev) => [newGuest, ...prev]);
    }
  };

  const handleUpdateGuest = async (updated: Guest) => {
    if (firebaseUser) {
      await saveUserGuest(firebaseUser.uid, { ...updated, userId: firebaseUser.uid });
    } else {
      setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    }
    if (selectedGuest && selectedGuest.id === updated.id) {
      setSelectedGuest(updated);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (firebaseUser) {
      await removeUserGuest(firebaseUser.uid, guestId);
    } else {
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
    }
    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest(null);
    }
  };

  const handleToggleVerified = async (guestId: string) => {
    const target = guests.find((g) => g.id === guestId);
    if (!target) return;
    const updated = { ...target, isVerified: !target.isVerified };
    if (firebaseUser) {
      await saveUserGuest(firebaseUser.uid, updated);
    } else {
      setGuests((prev) => prev.map((g) => (g.id === guestId ? updated : g)));
    }
  };

  const handleImportGuests = async (imported: Guest[]) => {
    if (firebaseUser) {
      for (const g of imported) {
        await saveUserGuest(firebaseUser.uid, { ...g, userId: firebaseUser.uid });
      }
    } else {
      setGuests((prev) => [...imported, ...prev]);
    }
  };

  // Gallery CRUD Operations
  const handleAddPhoto = async (newPhoto: GalleryPhoto) => {
    if (firebaseUser) {
      await saveUserPhoto(firebaseUser.uid, { ...newPhoto, userId: firebaseUser.uid });
    } else {
      setPhotos((prev) => [newPhoto, ...prev]);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (firebaseUser) {
      await removeUserPhoto(firebaseUser.uid, photoId);
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }
  };

  const handleUpdateGuestSouvenir = async (guestId: string, taken: boolean, souvenirItemId?: string) => {
    const updatedGuests = guests.map((g) => {
      if (g.id === guestId) {
        return {
          ...g,
          souvenirTaken: taken,
          souvenirTakenAt: taken ? Date.now() : undefined,
          souvenirItemId: taken ? souvenirItemId || g.souvenirItemId : undefined,
        };
      }
      return g;
    });

    setGuests(updatedGuests);

    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest((prev) =>
        prev
          ? {
              ...prev,
              souvenirTaken: taken,
              souvenirTakenAt: taken ? Date.now() : undefined,
              souvenirItemId: taken ? souvenirItemId || prev.souvenirItemId : undefined,
            }
          : null
      );
    }

    if (firebaseUser) {
      const target = updatedGuests.find((g) => g.id === guestId);
      if (target) {
        try {
          await saveUserGuest(firebaseUser.uid, target);
        } catch (err) {
          console.error('Failed to sync souvenir status to Firestore:', err);
        }
      }
    }
  };

  const handleResetDatabase = async () => {
    if (firebaseUser) {
      for (const g of guests) {
        await removeUserGuest(firebaseUser.uid, g.id);
      }
      for (const p of photos) {
        await removeUserPhoto(firebaseUser.uid, p.id);
      }
      for (const g of INITIAL_GUESTS) {
        await saveUserGuest(firebaseUser.uid, { ...g, userId: firebaseUser.uid });
      }
      for (const p of INITIAL_PHOTOS) {
        await saveUserPhoto(firebaseUser.uid, { ...p, userId: firebaseUser.uid });
      }
    } else {
      setGuests(INITIAL_GUESTS);
      setPhotos(INITIAL_PHOTOS);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      event: session.weddingTitle || 'The Wedding of Kevin & Clarissa',
      user: firebaseUser?.email || session.email,
      exportDate: new Date().toISOString(),
      guests,
      photos,
      session,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_wedding_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQRScanSuccess = (guestData: Partial<Guest>) => {
    setPrefillGuest(guestData);
    setActiveTab('input-tamu');
  };

  const handleUpdateSession = (updates: Partial<UserSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
  };

  const handleRSVPSubmitted = async (newGuest: Guest) => {
    if (firebaseUser) {
      await saveUserGuest(firebaseUser.uid, { ...newGuest, userId: firebaseUser.uid });
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const targetUid = urlParams.get('u') || 'demo-wedding-organizer';
      try {
        await submitPublicRSVP(targetUid, newGuest);
      } catch (err) {
        console.warn('Public RSVP cloud persist fallback:', err);
      }
      setGuests((prev) => [newGuest, ...prev]);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setActiveTab('buku-tamu');
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-white to-orange-50/40 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FallingParticles enabled={particlesEnabled} />
        <div className="w-16 h-16 rounded-2xl glass-panel text-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/10 mb-4 animate-pulse border border-white/80">
          <span className="font-headline text-xl font-bold">K &amp; C</span>
        </div>
        <p className="font-headline text-base font-bold text-[#c2410c]">
          Memuat EBook Wedding...
        </p>
        <span className="text-xs text-orange-900/60 mt-1">
          Menghubungkan ke Cloud Firestore
        </span>
      </div>
    );
  }

  // Not logged in: Show Registration / Login Gate (Required to access Dashboard)
  if (!firebaseUser) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <FallingParticles enabled={particlesEnabled} />
        <AuthView
          onOpenRSVP={() => setIsRSVPOpen(true)}
          onLoginSuccess={() => {
            // onAuthStateChanged will handle setting the user
          }}
        />

        {/* Public RSVP Modal for guests without admin login */}
        <RSVPModal
          isOpen={isRSVPOpen}
          onClose={() => setIsRSVPOpen(false)}
          onSubmitRSVP={handleRSVPSubmitted}
        />
      </div>
    );
  }

  // Logged in: Render Full Dashboard for this User
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbf7] via-[#ffffff] to-[#fff7ed] text-[#1f160f] flex flex-col selection:bg-orange-200 selection:text-orange-950 relative overflow-x-hidden">
      {/* Ambient glowing glass backdrop circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-orange-400/15 to-amber-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-orange-400/12 to-rose-300/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-400/15 to-orange-400/15 blur-3xl" />
      </div>

      {/* Floating Blossom & Snow Particles Overlay */}
      <FallingParticles enabled={particlesEnabled} />

      {/* Responsive Modern Sidebar Navigation */}
      <SidebarNav
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        guestCount={guests.length}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
        onOpenAdminPortal={() => setActiveTab('akun-admin')}
        onOpenRSVP={() => setIsRSVPOpen(true)}
        onOpenKiosk={() => setIsKioskOpen(true)}
        onLogout={handleLogout}
      />

      {/* Top Header Bar with Live Cloud Sync indicator */}
      <Header
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdminPortal={() => setActiveTab('akun-admin')}
        onOpenQRScan={() => setIsQRScanOpen(true)}
        onOpenKiosk={() => setIsKioskOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        guestCount={guests.length}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full md:pl-64 lg:pl-72 relative z-10 transition-all ${
          activeTab === 'akun-admin' ? 'pt-4 md:pt-8' : 'pt-16 md:pt-20'
        }`}
      >
        {activeTab === 'buku-tamu' && (
          <BukuTamuView
            guests={guests}
            onAddGuestClick={() => setActiveTab('input-tamu')}
            onSelectGuest={(guest) => setSelectedGuest(guest)}
            onOpenQRScan={() => setIsQRScanOpen(true)}
            onOpenRSVP={() => setIsRSVPOpen(true)}
            onImportGuests={handleImportGuests}
            onToggleVerified={handleToggleVerified}
          />
        )}

        {activeTab === 'input-tamu' && (
          <InputTamuView
            guestCount={guests.length}
            onGuestCreated={handleGuestCreated}
            onOpenQRScan={() => setIsQRScanOpen(true)}
            onOpenRSVP={() => setIsRSVPOpen(true)}
            initialPrefill={prefillGuest}
          />
        )}

        {activeTab === 'kelola-souvenir' && (
          <KelolaSouvenirView
            guests={guests}
            onUpdateGuestSouvenir={handleUpdateGuestSouvenir}
            onOpenQRScan={() => setIsQRScanOpen(true)}
          />
        )}

        {activeTab === 'galeri-wedding' && (
          <GaleriView
            photos={photos}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            onOpenKiosk={() => setIsKioskOpen(true)}
          />
        )}

        {activeTab === 'laporan-dan-cetak' && (
          <LaporanView guests={guests} session={session} />
        )}

        {activeTab === 'akun-admin' && (
          <AdminPortalView
            session={session}
            onUpdateSession={handleUpdateSession}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onResetDatabase={handleResetDatabase}
            onExportBackup={handleExportBackup}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'panduan-bantuan' && (
          <PanduanBantuanView onNavigateToTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'tentang-aplikasi' && (
          <TentangAplikasiView onNavigateToTab={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        guestCount={guests.length}
      />

      {/* QR Code Modal: Tampilkan QR Meja Tamu (Self-Service) & Scanner Undangan */}
      <QRScanModal
        isOpen={isQRScanOpen}
        onClose={() => setIsQRScanOpen(false)}
        onScanSuccess={handleQRScanSuccess}
        onOpenRSVP={() => setIsRSVPOpen(true)}
        userId={firebaseUser?.uid}
      />

      {/* Self-Service RSVP & Buku Tamu Digital Mandiri Modal */}
      <RSVPModal
        isOpen={isRSVPOpen}
        onClose={() => setIsRSVPOpen(false)}
        onSubmitRSVP={handleRSVPSubmitted}
      />

      {/* Guest Detail & Souvenir Token Modal */}
      <GuestDetailModal
        guest={selectedGuest}
        onClose={() => setSelectedGuest(null)}
        onUpdateGuest={handleUpdateGuest}
        onDeleteGuest={handleDeleteGuest}
        onToggleSouvenir={handleUpdateGuestSouvenir}
      />

      {/* Interactive Kiosk / Reception TV Display Modal */}
      <KioskDisplayModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
        photos={photos}
        guests={guests}
        onOpenRSVP={() => {
          setIsKioskOpen(false);
          setIsRSVPOpen(true);
        }}
        onOpenQRScan={() => {
          setIsKioskOpen(false);
          setIsQRScanOpen(true);
        }}
        onAddPhoto={handleAddPhoto}
      />
    </div>
  );
}
