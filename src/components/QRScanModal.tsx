import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Guest } from '../types';
import { sound } from '../utils/sound';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (guestData: Partial<Guest>) => void;
  onOpenRSVP?: () => void;
  userId?: string;
}

export const QRScanModal: React.FC<QRScanModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onOpenRSVP,
  userId,
}) => {
  const [activeMode, setActiveMode] = useState<'display_qr' | 'scan_camera'>('display_qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoInvitations = [
    {
      name: 'Dr. H. Ahmad Farhan & Keluarga',
      gender: 'pria' as const,
      origin: 'Keluarga Mempelai Pria',
      prayerWish: 'Barakallahu lakum wa baraka alaikum. Semoga penuh sakinah, mawaddah wa rahmah.',
      envelopeNominal: 2500000,
    },
    {
      name: 'Ibu Felicia Wirawan & Suami',
      gender: 'wanita' as const,
      origin: 'Jakarta Selatan',
      prayerWish: 'Selamat menempuh hidup baru Kevin & Clarissa! Bahagia selalu selamanya.',
      envelopeNominal: 1500000,
    },
    {
      name: 'Keluarga Besar Bpk. Subroto',
      gender: 'pria' as const,
      origin: 'Surabaya',
      prayerWish: 'Selamat berbahagia untuk kedua mempelai dan keluarga besar.',
      envelopeNominal: 3000000,
    },
    {
      name: 'Bpk. Ir. Hendra Gunawan & Istri',
      gender: 'pria' as const,
      origin: 'Kolega Kantor',
      prayerWish: 'Selamat untuk Kevin & Clarissa, semoga langgeng hingga kakek nenek.',
      envelopeNominal: 1000000,
    },
  ];

  // Derive dynamic RSVP URL based on current host, path & organizer UID
  const rsvpUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?mode=rsvp${userId ? `&u=${encodeURIComponent(userId)}` : ''}`
    : 'https://wedding.example.com/?mode=rsvp';

  // Generate QR Code for Guests to scan with their mobile camera
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(rsvpUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1b1b21',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating guest RSVP QR:', err));
    }
  }, [isOpen, rsvpUrl]);

  // Handle camera start/stop when switching to scanner mode
  useEffect(() => {
    if (isOpen && activeMode === 'scan_camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Kamera tidak didukung pada peramban ini.');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Izin kamera belum aktif atau tidak tersedia. Gunakan simulasi atau unggah gambar QR.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const triggerSuccess = (data: Partial<Guest>) => {
    sound.playScanSuccess();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
    onScanSuccess(data);
    onClose();
  };

  const handleSimulateScan = (invitation: typeof demoInvitations[0]) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      triggerSuccess(invitation);
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const randomPreset = demoInvitations[Math.floor(Math.random() * demoInvitations.length)];
      triggerSuccess({
        ...randomPreset,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || randomPreset.name,
      });
    }, 700);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rsvpUrl);
    sound.playTap();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintStandee = () => {
    sound.playTap();
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="glass-card bg-stone-900/95 text-white w-full max-w-lg md:max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-orange-400/30 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header with Mode Tabs */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-orange-500/20 flex items-center justify-between shrink-0 bg-stone-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">
                {activeMode === 'display_qr' ? 'qr_code_2' : 'qr_code_scanner'}
              </span>
            </div>
            <h3 className="font-headline text-base sm:text-lg font-bold text-orange-100">
              {activeMode === 'display_qr' ? 'QR Tamu & RSVP Digital' : 'Scan Tiket Undangan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Mode Selector Switcher */}
        <div className="p-3 bg-stone-950/60 border-b border-orange-500/10 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-900/80 rounded-xl border border-orange-500/20 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setActiveMode('display_qr');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeMode === 'display_qr'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              <span>Tampilkan QR Tamu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setActiveMode('scan_camera');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeMode === 'scan_camera'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>Scan via Kamera</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TAMPILKAN QR TAMU */}
        {activeMode === 'display_qr' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center text-center space-y-4 font-body">
            
            {/* Standee Wedding Card Preview */}
            <div className="w-full max-w-md bg-gradient-to-b from-stone-900 via-stone-950 to-black border border-orange-400/40 rounded-2xl p-5 shadow-2xl relative text-white flex flex-col items-center">
              
              {/* Corner decorative ornaments in orange */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-orange-400 rounded-tl-sm"></div>
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-orange-400 rounded-tr-sm"></div>
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-orange-400 rounded-bl-sm"></div>
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-orange-400 rounded-br-sm"></div>

              {/* Monogram & Title */}
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-400/50 flex items-center justify-center mb-2">
                <span className="font-headline text-sm font-bold text-orange-300">K &amp; C</span>
              </div>

              <h4 className="font-headline text-lg sm:text-xl font-bold tracking-tight text-orange-200 leading-tight">
                The Wedding of Kevin &amp; Clarissa
              </h4>
              <p className="text-xs text-orange-100/70 mt-0.5">
                Grand Ballroom Hotel Mulia • 20 September 2026
              </p>

              {/* Real Scannable QR Code Image */}
              <div className="my-4 p-3 bg-white rounded-2xl shadow-xl border border-orange-300/40 flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code RSVP Tamu"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-500">
                    <span className="material-symbols-outlined animate-spin text-3xl text-orange-500">sync</span>
                  </div>
                )}
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-sm">camera_alt</span>
                  <span>Scan Kamera HP</span>
                </div>
              </div>

              <div className="text-center space-y-1 max-w-xs">
                <p className="text-xs sm:text-sm font-bold text-orange-100">
                  Arahkan Kamera HP ke QR Code
                </p>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Membuka formulir RSVP kehadiran, doa restu, amplop digital, &amp; kupon souvenir secara mandiri.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="w-full max-w-md space-y-2.5 pt-1">
              {/* Open RSVP Form Directly */}
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  if (onOpenRSVP) onOpenRSVP();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-lg">open_in_new</span>
                <span>Buka Form RSVP Sekarang</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-orange-300">
                    {copiedLink ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedLink ? 'Tersalin!' : 'Salin Link RSVP'}</span>
                </button>

                {/* Print Standee */}
                <button
                  type="button"
                  onClick={handlePrintStandee}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-orange-300">print</span>
                  <span>Cetak Standee QR</span>
                </button>
              </div>

              <div className="text-[11px] text-stone-400 text-center truncate pt-1">
                URL: {rsvpUrl}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SCANNER CAMERA (RECEPTIONIST MODE) */}
        {activeMode === 'scan_camera' && (
          <div className="flex flex-col">
            {/* Viewfinder with Live Video */}
            <div className="relative aspect-video sm:aspect-[4/3] max-h-80 w-full bg-black flex items-center justify-center overflow-hidden">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
              )}

              {/* Camera Error / Notice */}
              {cameraError && (
                <div className="absolute top-2 inset-x-2 p-2 rounded-lg bg-black/80 text-xs text-amber-300 text-center border border-amber-500/40 backdrop-blur-xs z-10">
                  {cameraError}
                </div>
              )}

              {/* Scanner Box Target with Orange Accents */}
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 border-2 border-orange-500/70 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.35)] z-10">
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-400 rounded-tl-md"></span>
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-400 rounded-tr-md"></span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-400 rounded-bl-md"></span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-400 rounded-br-md"></span>

                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse shadow-[0_0_10px_#f97316]"></div>

                {!cameraActive && (
                  <div className="flex flex-col items-center gap-1.5 text-white/80">
                    <span className="material-symbols-outlined text-4xl text-orange-400">qr_code_2</span>
                    <span className="text-xs font-medium tracking-wide">Arahkan ke Tiket QR</span>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-orange-300 z-20">
                  <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                  <span className="text-xs font-semibold">Membaca data undangan tamu...</span>
                </div>
              )}
            </div>

            {/* Upload QR File or Select Preset */}
            <div className="p-4 bg-stone-900 flex flex-col gap-2.5 border-t border-orange-500/20">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-semibold">Opsi Pemindaian:</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">file_upload</span>
                  Unggah Gambar QR
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto no-scrollbar pt-1">
                {demoInvitations.map((inv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulateScan(inv)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-orange-500/20 text-left flex items-center justify-between transition-all border border-white/10"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-white truncate">{inv.name}</span>
                      <span className="text-[10.5px] text-stone-400">{inv.origin}</span>
                    </div>
                    <span className="material-symbols-outlined text-base text-orange-400 shrink-0">bolt</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
