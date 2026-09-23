import React, { useState, useEffect } from 'react';
import { GalleryPhoto, Guest } from '../types';
import { APP_ASSETS } from '../data/initialData';
import { sound } from '../utils/sound';

interface KioskDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: GalleryPhoto[];
  guests: Guest[];
  onOpenRSVP: () => void;
  onOpenQRScan: () => void;
  onAddPhoto: (newPhoto: GalleryPhoto) => void;
}

export const KioskDisplayModal: React.FC<KioskDisplayModalProps> = ({
  isOpen,
  onClose,
  photos,
  guests,
  onOpenRSVP,
  onOpenQRScan,
  onAddPhoto,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPhotoDetail, setSelectedPhotoDetail] = useState<GalleryPhoto | null>(null);

  // Filter couple & event photos for slideshow
  const displayPhotos = photos.length > 0 ? photos : [
    {
      id: 'default-hero',
      title: 'Kevin & Clarissa - The Wedding',
      category: 'Akad & Resepsi',
      time: '19:00 WIB',
      location: 'Grand Ballroom',
      url: APP_ASSETS.coupleHero,
      tags: ['Pengantin', 'Momen Bahagia'],
      likes: 120,
      resolution: '4K Ultra HD',
    },
  ];

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play slideshow timer
  useEffect(() => {
    if (!isOpen || !isPlaying || displayPhotos.length <= 1) return;

    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayPhotos.length);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, [isOpen, isPlaying, displayPhotos.length]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Direct guest camera upload from Kiosk
  const handleKioskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    const newPhoto: GalleryPhoto = {
      id: `kiosk-${Date.now()}`,
      title: `Foto Momen Tamu - ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      category: 'Tamu & Photobooth',
      time: 'Baru saja',
      location: 'Kiosk Resepsionis',
      url: imageUrl,
      tags: ['Tamu Undangan', 'Live Kiosk'],
      likes: 1,
      resolution: 'Original Photo',
      authorRole: 'Tamu Undangan',
    };
    onAddPhoto(newPhoto);
    sound.playSuccess();
  };

  if (!isOpen) return null;

  const currentPhoto = displayPhotos[currentSlide] || displayPhotos[0];
  const recentGreetings = guests
    .filter((g) => g.prayerWish && g.prayerWish.trim().length > 0)
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* Background Image Carousel with Ken Burns subtle scale */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{ transition: 'opacity 1.2s ease-in-out, transform 8s ease-out' }}
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
            />
          </div>
        ))}
        {/* Luxury Vignette & Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/60"></div>
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-stone-950/20 to-stone-950/70"></div>
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between backdrop-blur-md bg-stone-950/40 border-b border-white/10">
        {/* Left: Couple Branding & Live Clock */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-amber-400/40 backdrop-blur-md flex items-center justify-center shadow-lg">
            <img
              src={APP_ASSETS.logo}
              alt="Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-widest font-body flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Kiosk Interaktif Tamu
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/80 font-mono text-xs font-semibold tracking-wider">
                {currentTime}
              </span>
            </div>
            <h2 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-white">
              The Wedding of Kevin &amp; Clarissa
            </h2>
          </div>
        </div>

        {/* Right: Controls (Play/Pause, Fullscreen, Close Kiosk) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Jeda Slideshow' : 'Lanjutkan Slideshow'}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span className="hidden md:inline">{isPlaying ? 'Jeda' : 'Mulai'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Layar Penuh (Fullscreen)"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-base font-bold">arrow_back</span>
            <span>Kembali ke Buku Tamu</span>
          </button>
        </div>
      </div>

      {/* Center Display: Hero Greeting & Slide Indicator */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-8 text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 backdrop-blur-md text-xs font-semibold tracking-wider uppercase animate-in fade-in">
          <span className="material-symbols-outlined text-sm">favorite</span>
          <span>Selamat Datang Tamu Undangan yang Berbahagia</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-md">
            Kevin &amp; Clarissa
          </h1>
          <p className="font-headline text-base sm:text-xl text-amber-200/90 italic drop-shadow-sm">
            &ldquo;Dua Hati, Satu Janji Suci Dalam Cinta&rdquo;
          </p>
          <p className="font-body text-xs sm:text-sm text-stone-300 font-medium pt-1">
            Sabtu, 24 Oktober 2026 • Grand Ballroom The Mulia Resort, Nusa Dua
          </p>
        </div>

        {/* Current Photo Info Pill */}
        <div className="p-3 px-5 rounded-2xl bg-stone-900/75 border border-white/15 backdrop-blur-md text-xs text-stone-200 inline-flex items-center gap-3 max-w-md shadow-xl">
          <span className="material-symbols-outlined text-amber-400 text-lg">photo_camera</span>
          <div className="text-left truncate">
            <p className="font-bold text-white truncate">{currentPhoto.title}</p>
            <p className="text-[11px] text-stone-400 truncate">{currentPhoto.location} • {currentPhoto.category}</p>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30">
            {currentSlide + 1}/{displayPhotos.length}
          </span>
        </div>

        {/* Slide navigation dots */}
        <div className="flex items-center gap-2 pt-2">
          {displayPhotos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                sound.playTap();
                setCurrentSlide(idx);
              }}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentSlide ? 'w-8 bg-amber-400 shadow-sm' : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
              title={`Foto ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section: Interactive Guest Actions & Wishes Ticker */}
      <div className="relative z-10 p-4 sm:p-6 backdrop-blur-xl bg-stone-950/65 border-t border-white/10 space-y-4">
        {/* Interactive Action Buttons for Guests */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Self-Service RSVP */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onOpenRSVP();
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-stone-950">edit_note</span>
            </div>
            <div className="text-left leading-tight">
              <div className="font-bold">Isi Kehadiran / RSVP</div>
              <div className="text-[10px] text-stone-900 font-normal">Catat nama &amp; kupon souvenir</div>
            </div>
          </button>

          {/* Action 2: Scan QR Attendance */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onOpenQRScan();
            }}
            className="p-3.5 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300 border border-amber-400/30">
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
            </div>
            <div className="text-left leading-tight">
              <div className="font-bold">Scan QR Undangan</div>
              <div className="text-[10px] text-stone-300 font-normal">Check-in tamu otomatis</div>
            </div>
          </button>

          {/* Action 3: Guest Upload Photo to Album */}
          <label className="p-3.5 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleKioskUpload}
            />
            <div className="w-8 h-8 rounded-xl bg-rose-400/20 flex items-center justify-center text-rose-300 border border-rose-400/30">
              <span className="material-symbols-outlined text-xl">add_a_photo</span>
            </div>
            <div className="text-left leading-tight">
              <div className="font-bold">Unggah Foto Kenangan</div>
              <div className="text-[10px] text-stone-300 font-normal">Tampilkan foto di layar display</div>
            </div>
          </label>
        </div>

        {/* Live Congratulations Ticker */}
        {recentGreetings.length > 0 && (
          <div className="max-w-4xl mx-auto flex items-center gap-3 pt-1 border-t border-white/10 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-bold text-[10.5px] shrink-0 flex items-center gap-1 border border-amber-400/30">
              <span className="material-symbols-outlined text-xs">chat</span>
              Ucapan Tamu:
            </span>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-marquee text-stone-300 text-[11px]">
                {recentGreetings.map((g, i) => (
                  <span key={g.id || i} className="mr-8">
                    <strong className="text-amber-200 font-bold">{g.name}</strong>: &ldquo;{g.prayerWish}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
