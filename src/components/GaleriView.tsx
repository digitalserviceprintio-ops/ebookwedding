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
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-4 pb-28">
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

      {/* Lightbox / Zoom Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#1b1b21] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
          >
            <div className="relative aspect-square bg-black">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 text-white flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-[18px] font-semibold">
                  {selectedPhoto.title}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#c5a059] text-black font-bold">
                  {selectedPhoto.resolution || 'HD'}
                </span>
              </div>
              <p className="text-[12px] text-white/70">
                {selectedPhoto.location} • {selectedPhoto.time}
              </p>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                {onDeletePhoto && (
                  <button
                    onClick={() => {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[12px] font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Hapus
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={(e) => downloadPhoto(selectedPhoto, e)}
                    className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-[12px] font-semibold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Unduh File
                  </button>
                  <button
                    onClick={(e) => sharePhoto(selectedPhoto, e)}
                    className="px-3 py-1.5 rounded-lg bg-[#775a19] text-white text-[12px] font-semibold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    Share WA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title & Cloud Sync Header */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[20px] fill-1">
              auto_awesome
            </span>
            <span className="font-headline text-[18px] font-bold text-[#1b1b21]">
              Dokumentasi Momen
            </span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eae7ef] text-[#4e4639] font-body text-[10px] font-bold">
            <span className="material-symbols-outlined text-[12px] text-[#735c00] mr-1 fill-1">
              cloud_done
            </span>
            Cloud Sync Aktif
          </span>
        </div>
        <p className="font-body text-[11px] text-[#7f7667] flex items-center gap-1.5 flex-wrap">
          <span>{photos.length + 45} Foto Tersimpan</span>
          <span className="w-1 h-1 rounded-full bg-[#d1c5b4] inline-block"></span>
          <span>4 Album</span>
          <span className="w-1 h-1 rounded-full bg-[#d1c5b4] inline-block"></span>
          <span className="text-[#775a19] font-medium flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            Firebase Storage Terenkripsi
          </span>
        </p>
      </div>

      {/* Interactive Upload Card */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e4e1ea]/60 p-3.5 flex flex-col space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#ffdea5] flex items-center justify-center text-[#261900]">
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            </div>
            <div>
              <h3 className="font-body text-[13px] font-bold text-[#1b1b21]">
                Unggah Momen Baru
              </h3>
              <p className="font-body text-[10px] text-[#7f7667]">
                Simpan ke arsip kenangan Kevin &amp; Clarissa
              </p>
            </div>
          </div>
          <span className="text-[#735c00] bg-[#ffe088]/50 px-2 py-0.5 rounded-full font-body text-[10px] font-bold">
            Maks 25MB
          </span>
        </div>

        {/* Tap / Drop Area */}
        <div
          onClick={triggerUploadClick}
          className="bg-[#f5f2fb] hover:bg-[#eae7ef] border border-dashed border-[#c5a059]/60 rounded-xl p-3.5 flex flex-col items-center justify-center text-center space-y-1 cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#775a19] mb-0.5 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
          </div>
          <span className="font-body text-[12.5px] font-semibold text-[#1b1b21]">
            Ketuk untuk memilih foto dari galeri HP
          </span>
          <span className="font-body text-[10.5px] text-[#7f7667]">
            Mendukung format JPG, PNG, atau HEIC dari kamera
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={triggerUploadClick}
            type="button"
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#775a19] text-white font-body text-[12px] font-semibold active:scale-95 transition-transform shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px]">collections</span>
            <span>Buka Galeri HP</span>
          </button>
          <button
            onClick={triggerCameraClick}
            type="button"
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#eae7ef] text-[#1b1b21] font-body text-[12px] font-semibold active:scale-95 transition-transform border border-[#e4e1ea]/60"
          >
            <span className="material-symbols-outlined text-[17px]">photo_camera</span>
            <span>Kamera Langsung</span>
          </button>
        </div>

        {/* Upload Progress Card */}
        <div className="bg-[#f5f2fb] rounded-lg p-2.5 flex flex-col space-y-1.5 border border-[#e4e1ea]/40">
          <div className="flex items-center justify-between font-body text-[10.5px]">
            <span className="text-[#4e4639] flex items-center gap-1 font-medium">
              <span
                className={`material-symbols-outlined text-[13px] text-[#735c00] ${
                  isSimulatingUpload ? 'animate-spin' : ''
                }`}
              >
                sync
              </span>
              {isSimulatingUpload ? 'Mengunggah 1 file...' : 'Tersinkronisasi Cloud'}
            </span>
            <span className="text-[#775a19] font-bold">{uploadPercent}% Tersimpan di Cloud</span>
          </div>
          <div className="w-full bg-[#e4e1ea] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#775a19] h-full rounded-full transition-all duration-500"
              style={{ width: `${uploadPercent}%` }}
            ></div>
          </div>
          <span className="font-body text-[10px] text-[#7f7667] text-right truncate">
            wedding_kc_resepsi_raw_048.heic
          </span>
        </div>
      </div>

      {/* Album Category Chips */}
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-body text-[12px] font-bold text-[#1b1b21]">
            Kategori Album
          </span>
          <span className="font-body text-[11px] font-semibold text-[#775a19] hover:underline cursor-pointer">
            Lihat Struktur Folder
          </span>
        </div>
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`shrink-0 px-3 py-1.5 rounded-full font-body text-[11.5px] font-semibold flex items-center space-x-1 transition-all ${
                  isActive
                    ? 'bg-[#775a19] text-white shadow-xs'
                    : 'bg-[#efecf5] text-[#4e4639] hover:bg-[#eae7ef] border border-[#e4e1ea]/50'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#7f7667]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Photo Grid Gallery */}
      <div className="flex flex-col space-y-3">
        {/* Featured Hero Photo */}
        {heroPhoto && (
          <div className="bg-white rounded-xl shadow-sm border border-[#e4e1ea]/60 overflow-hidden flex flex-col">
            <div
              onClick={() => setSelectedPhoto(heroPhoto)}
              className="relative w-full aspect-square bg-[#efecf5] cursor-pointer group"
            >
              <img
                alt={heroPhoto.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                src={heroPhoto.url}
              />
              {/* Pinned & Quality Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#92484f] text-white font-body text-[10px] font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[12px] mr-1 fill-1">
                    push_pin
                  </span>
                  Disematkan
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-body text-[10px] font-medium">
                  {heroPhoto.resolution || '4K Ultra HD'}
                </span>
              </div>
              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(heroPhoto);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[17px]">fullscreen</span>
              </button>
              {/* Overlay Details Bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3.5 flex flex-col justify-end text-white">
                <div className="flex items-center space-x-1 mb-0.5">
                  <span className="material-symbols-outlined text-[#e9c176] text-[15px] fill-1">
                    favorite
                  </span>
                  <span className="font-body text-[10.5px] text-[#e9c176] font-bold">
                    Foto Resmi Sampul Album
                  </span>
                </div>
                <h2 className="font-headline text-[17px] font-semibold leading-snug">
                  {heroPhoto.title}
                </h2>
                <p className="font-body text-[11px] text-white/80">
                  {heroPhoto.location} • {heroPhoto.time}
                </p>
              </div>
            </div>

            {/* Action & Tagging Bar */}
            <div className="p-3 flex flex-col space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 bg-[#f5f2fb] px-2.5 py-1 rounded-lg text-[#4e4639] font-body text-[10.5px] border border-[#e4e1ea]/40">
                  <span className="material-symbols-outlined text-[#775a19] text-[15px]">
                    how_to_reg
                  </span>
                  <span>
                    Tag: <strong>Pengantin (2)</strong>, <strong>Keluarga Inti (8)</strong>
                  </span>
                </div>
                <button
                  onClick={(e) => handleLike(heroPhoto.id, e)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#ffdadb] text-[#3c0610] font-body text-[11px] font-bold active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[14px] fill-1 text-[#92484f]">
                    favorite
                  </span>
                  <span>{likesMap[heroPhoto.id]?.count || heroPhoto.likes}</span>
                </button>
              </div>

              {/* High-Res Download & Share */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={(e) => downloadPhoto(heroPhoto, e)}
                  type="button"
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#efecf5] text-[#1b1b21] font-body text-[11.5px] font-semibold active:scale-98 transition-transform border border-[#e4e1ea]/50"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#775a19]">
                    download
                  </span>
                  <span>Unduh Asli (12MB)</span>
                </button>
                <button
                  onClick={(e) => sharePhoto(heroPhoto, e)}
                  type="button"
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-[#775a19] text-white font-body text-[11.5px] font-semibold active:scale-98 transition-transform shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">share</span>
                  <span>Kirim WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Media Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {gridPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="bg-white rounded-xl shadow-xs border border-[#e4e1ea]/60 overflow-hidden flex flex-col cursor-pointer group"
            >
              <div className="relative w-full aspect-square bg-[#efecf5]">
                <img
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  src={photo.url}
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white font-body text-[9.5px] font-medium backdrop-blur-xs">
                  {photo.tags[0] || 'Venue'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(photo);
                  }}
                  className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                </button>
              </div>
              <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1">
                <div>
                  <h4 className="font-body text-[12px] font-bold text-[#1b1b21] line-clamp-1">
                    {photo.title}
                  </h4>
                  <p className="font-body text-[10px] text-[#7f7667]">
                    {photo.time} • {photo.location}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#e4e1ea]/30">
                  <span className="text-[#735c00] font-body text-[10px] font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">person_pin</span>
                    {photo.authorRole || 'Vendor'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => downloadPhoto(photo, e)}
                      className="text-[#7f7667] hover:text-[#775a19] p-0.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                    </button>
                    <button
                      onClick={(e) => sharePhoto(photo, e)}
                      className="text-[#7f7667] hover:text-[#775a19] p-0.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Slot: Interactive Upload Card Tile */}
        <div
          onClick={triggerUploadClick}
          className="bg-[#f5f2fb] hover:bg-[#eae7ef] rounded-xl p-3 flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer shadow-xs border border-[#e4e1ea]/60"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#ffdea5] flex items-center justify-center text-[#775a19]">
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            </div>
            <div className="flex flex-col">
              <span className="font-body text-[12.5px] text-[#1b1b21] font-bold">
                + Unggah Foto Lagi dari Galeri
              </span>
              <span className="font-body text-[10.5px] text-[#7f7667]">
                Koleksi tamu &amp; momen candid resepsi
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#775a19] text-[20px]">
            chevron_right
          </span>
        </div>
      </div>

      {/* Guestbook Integration Banner */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-[#e4e1ea]/60 flex items-start space-x-2.5">
        <div className="w-8 h-8 rounded-full bg-[#ffdadb] flex items-center justify-center text-[#3c0610] shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[16px]">bookmark_heart</span>
        </div>
        <div className="flex flex-col space-y-0.5">
          <h4 className="font-body text-[12.5px] font-bold text-[#1b1b21]">
            Sinkronisasi Buku Tamu Otomatis
          </h4>
          <p className="font-body text-[11px] text-[#7f7667] leading-relaxed">
            Setiap foto yang Anda unggah dapat langsung dihubungkan dengan nama tamu undangan dan
            ucapan selamat di tab <strong>Buku Tamu</strong>.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Upload Button */}
      <div className="sticky bottom-20 w-full flex justify-center z-30 pointer-events-none pb-2">
        <button
          onClick={triggerUploadClick}
          className="pointer-events-auto flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#775a19] hover:bg-[#634b15] text-white font-body text-[12.5px] font-bold shadow-xl active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          <span>Unggah dari Galeri</span>
        </button>
      </div>
    </div>
  );
};
