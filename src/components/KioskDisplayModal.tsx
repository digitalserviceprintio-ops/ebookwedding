import React, { useState, useEffect, useRef } from 'react';
import { GalleryPhoto, Guest } from '../types';
import { APP_ASSETS, INITIAL_PHOTOS } from '../data/initialData';
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
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain'); // default 'contain' to ensure photo is 100% visible and uncropped
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Touch gesture support
  const touchStartXRef = useRef<number | null>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Pool of display photos: use current user photos if available, or fall back to full initial photo set
  const displayPhotos: GalleryPhoto[] = photos.length > 0 ? photos : INITIAL_PHOTOS;

  // Live Digital Clock (WIB)
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

  // Auto-play slideshow timer (every 6 seconds if playing)
  useEffect(() => {
    if (!isOpen || !isPlaying || displayPhotos.length <= 1) return;

    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayPhotos.length);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, [isOpen, isPlaying, displayPhotos.length]);

  // Keyboard navigation (Arrow keys, Space, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sound.playTap();
        setCurrentSlide((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sound.playTap();
        setCurrentSlide((prev) => (prev + 1) % displayPhotos.length);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, displayPhotos.length, onClose]);

  // Auto-scroll thumbnail bar to active photo
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[currentSlide] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [currentSlide]);

  const handlePrev = () => {
    sound.playTap();
    setCurrentSlide((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  const handleNext = () => {
    sound.playTap();
    setCurrentSlide((prev) => (prev + 1) % displayPhotos.length);
  };

  // Touch Swipe for mobile/tablet kiosks
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  // Fullscreen Toggle
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
    setCurrentSlide(displayPhotos.length); // Jump to newly uploaded photo
  };

  if (!isOpen) return null;

  const currentPhoto = displayPhotos[currentSlide] || displayPhotos[0];
  const recentGreetings = guests
    .filter((g) => g.prayerWish && g.prayerWish.trim().length > 0)
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0806] text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* Ambient Blurred Background (Cinematic Backdrop) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          key={`ambient-${currentPhoto.id}`}
          src={currentPhoto.url}
          alt="Ambient Background"
          className="w-full h-full object-cover filter blur-3xl opacity-20 scale-125 transition-all duration-1000 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0806] via-[#0a0806]/70 to-[#0a0806]/85" />
      </div>

      {/* Top Header Bar: Responsive & Compact */}
      <div className="relative z-20 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between backdrop-blur-xl bg-black/40 border-b border-amber-500/20 shadow-sm shrink-0">
        {/* Left: Couple Branding & Live Clock */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 p-1 border border-amber-400/40 backdrop-blur-md flex items-center justify-center shadow-md shrink-0">
            <img
              src={APP_ASSETS.logo}
              alt="Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-amber-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider font-body flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Kiosk Display
              </span>
              <span className="text-white/40 text-xs hidden sm:inline">•</span>
              <span className="text-white/70 font-mono text-[10px] sm:text-xs font-semibold tracking-wider hidden sm:inline">
                {currentTime}
              </span>
            </div>
            <h2 className="font-headline text-sm sm:text-lg font-bold tracking-tight text-white truncate">
              Kevin &amp; Clarissa
            </h2>
          </div>
        </div>

        {/* Right Controls: Fit Mode, Play/Pause, Fullscreen, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Fit Mode Toggle: Contain (Utuh) vs Cover (Penuh) */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
            }}
            title={fitMode === 'contain' ? 'Mode Foto: Utuh (Semua Terlihat)' : 'Mode Foto: Isi Layar'}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-amber-300 transition-all flex items-center gap-1 text-[11px] sm:text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-base">
              {fitMode === 'contain' ? 'aspect_ratio' : 'fit_screen'}
            </span>
            <span className="hidden md:inline">
              {fitMode === 'contain' ? 'Foto Utuh (100% Terlihat)' : 'Isi Layar'}
            </span>
          </button>

          {/* Toggle Thumbnails */}
          <button
            type="button"
            onClick={() => setShowThumbnails((prev) => !prev)}
            title="Sembunyikan / Tampilkan Galeri Thumbnail"
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all hidden sm:flex items-center"
          >
            <span className="material-symbols-outlined text-lg">
              {showThumbnails ? 'expand_more' : 'collections'}
            </span>
          </button>

          {/* Play / Pause Slideshow */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setIsPlaying(!isPlaying);
            }}
            title={isPlaying ? 'Jeda Slideshow (Spasi)' : 'Mulai Slideshow (Spasi)'}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all flex items-center"
          >
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Layar Penuh (Fullscreen)"
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-all hidden xs:flex items-center"
          >
            <span className="material-symbols-outlined text-lg">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>

          {/* Close Kiosk Modal */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="py-1.5 px-3 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-base font-bold">arrow_back</span>
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </div>
      </div>

      {/* Main Center Stage: Responsive Photo Frame (100% Terlihat Tanpa Terpotong) */}
      <div
        className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden min-h-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left (Desktop & Tablet) */}
        <button
          type="button"
          onClick={handlePrev}
          title="Foto Sebelumnya (Panah Kiri)"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-amber-500 hover:text-stone-950 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-xl active:scale-90"
        >
          <span className="material-symbols-outlined text-2xl font-bold">chevron_left</span>
        </button>

        {/* Navigation Arrow Right (Desktop & Tablet) */}
        <button
          type="button"
          onClick={handleNext}
          title="Foto Selanjutnya (Panah Kanan)"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-amber-500 hover:text-stone-950 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-xl active:scale-90"
        >
          <span className="material-symbols-outlined text-2xl font-bold">chevron_right</span>
        </button>

        {/* Central Responsive Showcase Frame */}
        <div className="relative w-full h-full flex flex-col items-center justify-center max-w-5xl mx-auto px-6 sm:px-12">
          {/* Main Photo Container: object-contain guarantees NO cropping on any device */}
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden min-h-0 py-1">
            <img
              key={`slide-${currentPhoto.id}`}
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className={`max-h-[46vh] sm:max-h-[54vh] lg:max-h-[60vh] w-auto max-w-full rounded-2xl shadow-2xl transition-all duration-500 ease-out border border-amber-400/30 ${
                fitMode === 'contain'
                  ? 'object-contain'
                  : 'object-cover w-full h-full'
              }`}
            />
          </div>

          {/* Photo Info Banner: Placed neatly below the photo so it NEVER covers faces */}
          <div className="mt-2 sm:mt-3 px-4 py-2 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md text-center max-w-xl w-full flex items-center justify-between gap-3 shadow-xl shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                  {currentPhoto.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-amber-200/80 truncate">
                  {currentPhoto.category} • {currentPhoto.location || 'The Wedding'}
                </p>
              </div>
            </div>

            {/* Slide Index Counter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-400/30">
                {currentSlide + 1} / {displayPhotos.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Thumbnails Bar, Interactive Guest Actions & Wishes Ticker */}
      <div className="relative z-20 backdrop-blur-2xl bg-black/70 border-t border-amber-500/20 shrink-0">
        {/* Horizontal Thumbnail Strip (Visible across all screens, scrollable) */}
        {showThumbnails && displayPhotos.length > 1 && (
          <div className="px-3 sm:px-6 pt-2 pb-1.5 border-b border-white/10">
            <div
              ref={thumbnailContainerRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth max-w-4xl mx-auto"
            >
              {displayPhotos.map((photo, index) => {
                const isActive = index === currentSlide;
                return (
                  <button
                    key={`thumb-${photo.id}-${index}`}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setCurrentSlide(index);
                    }}
                    className={`relative shrink-0 rounded-xl overflow-hidden transition-all group ${
                      isActive
                        ? 'w-16 h-12 sm:w-20 sm:h-14 ring-2 ring-amber-400 scale-105 shadow-lg'
                        : 'w-12 h-10 sm:w-16 sm:h-12 opacity-60 hover:opacity-100 ring-1 ring-white/20'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 Interactive Guest Actions for Kiosk */}
        <div className="p-2.5 sm:p-4 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Action 1: Self-Service RSVP */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onOpenRSVP();
            }}
            className="p-2.5 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/25 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg sm:text-xl text-stone-950">edit_note</span>
            </div>
            <div className="text-left leading-tight truncate">
              <div className="font-bold truncate">Isi Kehadiran / RSVP</div>
              <div className="text-[10px] text-stone-900 font-normal truncate">Catat nama &amp; kupon souvenir</div>
            </div>
          </button>

          {/* Action 2: Scan QR Attendance */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onOpenQRScan();
            }}
            className="p-2.5 sm:p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-all"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 border border-amber-400/30 shrink-0">
              <span className="material-symbols-outlined text-lg sm:text-xl">qr_code_scanner</span>
            </div>
            <div className="text-left leading-tight truncate">
              <div className="font-bold truncate">Scan QR Undangan</div>
              <div className="text-[10px] text-stone-300 font-normal truncate">Check-in tamu otomatis</div>
            </div>
          </button>

          {/* Action 3: Guest Upload Photo to Album */}
          <label className="p-2.5 sm:p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm active:scale-95 transition-all cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleKioskUpload}
            />
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-400/20 flex items-center justify-center text-rose-300 border border-rose-400/30 shrink-0">
              <span className="material-symbols-outlined text-lg sm:text-xl">add_a_photo</span>
            </div>
            <div className="text-left leading-tight truncate">
              <div className="font-bold truncate">Unggah Foto Momen</div>
              <div className="text-[10px] text-stone-300 font-normal truncate">Tampilkan langsung di layar</div>
            </div>
          </label>
        </div>

        {/* Live Congratulations Ticker */}
        {recentGreetings.length > 0 && (
          <div className="px-3 sm:px-6 py-1.5 border-t border-white/10 max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px] shrink-0 flex items-center gap-1 border border-amber-400/30">
              <span className="material-symbols-outlined text-xs">chat</span>
              Doa Tamu:
            </span>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-marquee text-stone-300 text-[10.5px]">
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
