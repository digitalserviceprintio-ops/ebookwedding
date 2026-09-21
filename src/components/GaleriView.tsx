import React, { useState, useRef } from 'react';
import { GalleryPhoto } from '../types';

interface GaleriViewProps {
  photos: GalleryPhoto[];
  onAddPhoto: (newPhoto: GalleryPhoto) => void;
  onDeletePhoto?: (photoId: string) => void;
}

export const GaleriView: React.FC<GaleriViewProps> = ({ photos, onAddPhoto, onDeletePhoto }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Semua Foto');
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(100);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, { count: number; userLiked: boolean }>>({
    'p-001': { count: 124, userLiked: false },
    'p-002': { count: 56, userLiked: false },
    'p-003': { count: 89, userLiked: false },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { name: 'Semua Foto', count: photos.length },
    { name: 'Akad & Resepsi', count: 24 },
    { name: 'Tamu & Photobooth', count: 16 },
    { name: 'Dekorasi Venue', count: 8 },
  ];

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikesMap((prev) => {
      const current = prev[id] || { count: 50, userLiked: false };
      return {
        ...prev,
        [id]: {
          count: current.userLiked ? current.count - 1 : current.count + 1,
          userLiked: !current.userLiked,
        },
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setIsSimulatingUpload(true);
    setUploadPercent(20);

    const timer1 = setTimeout(() => setUploadPercent(65), 300);
    const timer2 = setTimeout(() => {
      setUploadPercent(100);
      const newPhoto: GalleryPhoto = {
        id: `p-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Tamu & Photobooth',
        time: 'Baru saja',
        location: 'Photobooth Foyer',
        url: imageUrl,
        tags: ['Momen Baru', 'Tamu Undangan'],
        likes: 1,
        resolution: 'Original HD',
        authorRole: 'Petugas Meja',
      };
      onAddPhoto(newPhoto);
      setIsSimulatingUpload(false);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const sharePhoto = (photo: GalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Lihat dokumentasi pernikahan Kevin & Clarissa: ${photo.title} (${photo.location})!`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const downloadPhoto = (photo: GalleryPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, '_')}.jpg`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  };

  const filteredPhotos = activeCategory === 'Semua Foto'
    ? photos
    : photos.filter((p) => p.category === activeCategory);

  const heroPhoto = photos.find((p) => p.isPinned) || photos[0];
  const gridPhotos = filteredPhotos.filter((p) => p.id !== heroPhoto.id);

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 pb-28">
      {/* Hidden file inputs for real upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Lightbox / Zoom Modal (Responsive Desktop & Mobile) */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-stone-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-orange-500/20 flex flex-col md:flex-row max-h-[90vh]"
          >
            <div className="relative md:w-3/5 bg-black flex items-center justify-center min-h-[260px] md:min-h-[420px]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh]"
              />
            </div>
            <div className="p-5 md:w-2/5 flex flex-col justify-between bg-stone-900 border-t md:border-t-0 md:border-l border-white/10">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider">
                    {selectedPhoto.category}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold">
                    {selectedPhoto.resolution || 'Original HD'}
                  </span>
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-bold text-white">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs text-stone-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-orange-400">location_on</span>
                  <span>{selectedPhoto.location}</span>
                  <span>•</span>
                  <span>{selectedPhoto.time}</span>
                </p>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Diunggah oleh:</span>
                    <span className="font-semibold text-orange-300">{selectedPhoto.authorRole || 'Petugas Registrasi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Tag Album:</span>
                    <span className="font-medium text-stone-200">{selectedPhoto.tags?.join(', ') || 'Momen Pernikahan'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => downloadPhoto(selectedPhoto, e)}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Unduh File
                  </button>
                  <button
                    onClick={(e) => sharePhoto(selectedPhoto, e)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <span className="material-symbols-outlined text-base">share</span>
                    Share WA
                  </button>
                </div>
                {onDeletePhoto && (
                  <button
                    onClick={() => {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="w-full py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Hapus Foto Ini
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header: Title & Cloud Sync with Citrus Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-orange-200/50">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-xs border border-orange-200">
              <span className="material-symbols-outlined text-lg fill-1">photo_library</span>
            </span>
            <h1 className="font-headline text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Galeri Dokumentasi
            </h1>
          </div>
          <p className="font-body text-xs text-stone-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{photos.length} Foto Aktif</span>
            <span className="w-1 h-1 rounded-full bg-orange-300 inline-block"></span>
            <span>4 Album Acara</span>
            <span className="w-1 h-1 rounded-full bg-orange-300 inline-block"></span>
            <span className="text-orange-700 font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Firebase Cloud Storage Terenkripsi
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 font-body text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Cloud Sync Aktif
          </span>
          <button
            onClick={triggerUploadClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-body text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_photo_alternate</span>
            <span>Unggah Foto</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop: 12 Cols, Mobile: 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Upload Controls, Category Navigation & Banner (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Citrus Glassmorphism Interactive Upload Card */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col space-y-3.5 border border-orange-200/70 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-xs">
                  <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                </div>
                <div>
                  <h3 className="font-body text-sm font-bold text-stone-900">
                    Unggah Momen Baru
                  </h3>
                  <p className="font-body text-[11px] text-stone-500">
                    Kevin &amp; Clarissa Wedding Album
                  </p>
                </div>
              </div>
              <span className="text-orange-700 bg-orange-100/90 border border-orange-200 px-2 py-0.5 rounded-full font-body text-[10.5px] font-bold">
                Maks 25MB
              </span>
            </div>

            {/* Drop / Tap Area */}
            <div
              onClick={triggerUploadClick}
              className="bg-white/80 hover:bg-orange-50/60 border-2 border-dashed border-orange-300/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer active:scale-[0.99] transition-all group"
            >
              <div className="w-11 h-11 rounded-full bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center text-orange-600 mb-0.5 shadow-xs transition-colors">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <span className="font-body text-xs sm:text-[13px] font-bold text-stone-900">
                Pilih Foto dari Galeri / Kamera
              </span>
              <span className="font-body text-[11px] text-stone-500">
                Format JPG, PNG, atau HEIC dari ponsel
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={triggerUploadClick}
                type="button"
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-body text-xs font-bold active:scale-95 transition-transform shadow-xs"
              >
                <span className="material-symbols-outlined text-base">collections</span>
                <span>Buka Galeri</span>
              </button>
              <button
                onClick={triggerCameraClick}
                type="button"
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-orange-50/80 text-stone-800 font-body text-xs font-bold active:scale-95 transition-transform border border-orange-200/80 shadow-xs"
              >
                <span className="material-symbols-outlined text-base text-orange-600">photo_camera</span>
                <span>Kamera Langsung</span>
              </button>
            </div>

            {/* Upload Progress Indicator */}
            <div className="bg-orange-50/70 rounded-xl p-3 flex flex-col space-y-1.5 border border-orange-200/50">
              <div className="flex items-center justify-between font-body text-[11px]">
                <span className="text-stone-700 flex items-center gap-1 font-medium">
                  <span
                    className={`material-symbols-outlined text-sm text-orange-600 ${
                      isSimulatingUpload ? 'animate-spin' : ''
                    }`}
                  >
                    sync
                  </span>
                  {isSimulatingUpload ? 'Mengunggah 1 file...' : 'Tersinkronisasi Cloud'}
                </span>
                <span className="text-orange-700 font-bold">{uploadPercent}% Tersimpan</span>
              </div>
              <div className="w-full bg-orange-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${uploadPercent}%` }}
                ></div>
              </div>
              <span className="font-body text-[10px] text-stone-500 text-right truncate">
                wedding_kc_photo_original.jpg
              </span>
            </div>
          </div>

          {/* Desktop Categories List & Quick Filters */}
          <div className="glass-card rounded-2xl p-4 border border-orange-200/70 shadow-sm space-y-2.5 hidden lg:block">
            <h4 className="font-body text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center justify-between">
              <span>Filter Kategori</span>
              <span className="text-orange-600 text-[11px] font-semibold">{photos.length} Total</span>
            </h4>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xs'
                        : 'bg-white/70 hover:bg-orange-50/80 text-stone-700 border border-orange-100'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guestbook Integration Banner */}
          <div className="glass-card rounded-2xl p-4 border border-orange-200/70 shadow-xs flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">bookmark_heart</span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <h4 className="font-body text-xs font-bold text-stone-900">
                Integrasi Buku Tamu
              </h4>
              <p className="font-body text-[11px] text-stone-600 leading-relaxed">
                Setiap foto yang diunggah otomatis terhubung dengan ucapan selamat di tab <strong>Buku Tamu</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Photo & Grid Gallery (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mobile Categories Carousel (Visible on mobile/tablet) */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 lg:hidden no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full font-body text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                      : 'bg-white/80 text-stone-700 hover:bg-orange-50/80 border border-orange-200/70'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Featured Hero Photo */}
          {heroPhoto && (
            <div className="glass-card rounded-2xl shadow-sm border border-orange-200/80 overflow-hidden flex flex-col">
              <div
                onClick={() => setSelectedPhoto(heroPhoto)}
                className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-stone-100 cursor-pointer group"
              >
                <img
                  alt={heroPhoto.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  src={heroPhoto.url}
                />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-600/90 text-white font-body text-[10.5px] font-bold shadow-sm backdrop-blur-xs">
                    <span className="material-symbols-outlined text-[13px] mr-1 fill-1">
                      push_pin
                    </span>
                    Foto Sampul Resmi
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-stone-900/70 backdrop-blur-md text-white font-body text-[10px] font-medium">
                    {heroPhoto.resolution || '4K Ultra HD'}
                  </span>
                </div>
                {/* Fullscreen Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(heroPhoto);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                </button>
                {/* Gradient Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent p-4 flex flex-col justify-end text-white">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="material-symbols-outlined text-amber-400 text-sm fill-1">
                      favorite
                    </span>
                    <span className="font-body text-xs text-amber-300 font-bold">
                      Momen Utama Kevin &amp; Clarissa
                    </span>
                  </div>
                  <h2 className="font-headline text-lg sm:text-xl font-bold leading-snug">
                    {heroPhoto.title}
                  </h2>
                  <p className="font-body text-xs text-white/80">
                    {heroPhoto.location} • {heroPhoto.time}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white/90">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 bg-orange-50 px-3 py-1 rounded-xl text-stone-700 font-body text-xs border border-orange-200/60">
                    <span className="material-symbols-outlined text-orange-600 text-sm">
                      how_to_reg
                    </span>
                    <span>
                      Tag: <strong>Pengantin</strong>, <strong>Keluarga Inti</strong>
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleLike(heroPhoto.id, e)}
                    className="flex items-center space-x-1 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-body text-xs font-bold active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm fill-1 text-rose-600">
                      favorite
                    </span>
                    <span>{likesMap[heroPhoto.id]?.count || heroPhoto.likes}</span>
                  </button>
                </div>

                {/* High-Res Download & Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => downloadPhoto(heroPhoto, e)}
                    type="button"
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 py-1.5 px-3.5 rounded-xl bg-white hover:bg-orange-50 text-stone-800 font-body text-xs font-semibold active:scale-98 transition-all border border-orange-200 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm text-orange-600">
                      download
                    </span>
                    <span>Unduh Asli</span>
                  </button>
                  <button
                    onClick={(e) => sharePhoto(heroPhoto, e)}
                    type="button"
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-body text-xs font-semibold active:scale-98 transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    <span>Kirim WA</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid Photo Gallery: Responsive 2-col on mobile, 3-col on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {gridPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="glass-card rounded-2xl shadow-xs border border-orange-200/70 overflow-hidden flex flex-col cursor-pointer group hover:border-orange-300 transition-all"
              >
                <div className="relative w-full aspect-square bg-stone-100 overflow-hidden">
                  <img
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={photo.url}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/60 text-white font-body text-[10px] font-medium backdrop-blur-xs">
                    {photo.tags[0] || 'Venue'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(photo);
                    }}
                    className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-stone-900/60 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">zoom_in</span>
                  </button>
                </div>
                <div className="p-3 flex flex-col justify-between flex-1 space-y-1.5 bg-white/90">
                  <div>
                    <h4 className="font-body text-xs sm:text-[13px] font-bold text-stone-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {photo.title}
                    </h4>
                    <p className="font-body text-[10.5px] text-stone-500">
                      {photo.time} • {photo.location}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-orange-100">
                    <span className="text-orange-700 font-body text-[10.5px] font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">person_pin</span>
                      {photo.authorRole || 'Vendor'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => downloadPhoto(photo, e)}
                        className="text-stone-400 hover:text-orange-600 p-1 rounded hover:bg-orange-50 transition-colors"
                        title="Unduh Foto"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                      </button>
                      <button
                        onClick={(e) => sharePhoto(photo, e)}
                        className="text-stone-400 hover:text-orange-600 p-1 rounded hover:bg-orange-50 transition-colors"
                        title="Share WhatsApp"
                      >
                        <span className="material-symbols-outlined text-base">share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Upload Tile */}
          <div
            onClick={triggerUploadClick}
            className="glass-card hover:bg-orange-50/70 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer shadow-xs border border-dashed border-orange-300"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-xl">add_a_photo</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-xs sm:text-sm text-stone-900 font-bold">
                  + Unggah Koleksi Foto Tamu &amp; Photobooth
                </span>
                <span className="font-body text-[11px] text-stone-500">
                  Simpan langsung ke arsip Cloud Firebase dengan enkripsi data
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-orange-600 text-xl">
              chevron_right
            </span>
          </div>
        </div>
      </div>

      {/* Mobile-only Sticky Bottom Floating Upload Button */}
      <div className="sm:hidden fixed bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none px-4">
        <button
          onClick={triggerUploadClick}
          className="pointer-events-auto flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-body text-xs font-bold shadow-xl active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">cloud_upload</span>
          <span>Unggah dari Galeri</span>
        </button>
      </div>
    </div>
  );
};
