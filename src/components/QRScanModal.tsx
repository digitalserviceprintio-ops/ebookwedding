import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Guest } from '../types';
import { sound } from '../utils/sound';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (guestData: Partial<Guest>) => void;
  onOpenRSVP?: () => void;
}

export const QRScanModal: React.FC<QRScanModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onOpenRSVP,
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

  // Derive dynamic RSVP URL based on current host & path
  const rsvpUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?mode=rsvp`
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#1b1b21] text-white w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex flex-col my-auto max-h-[94vh]">
        
        {/* Header with Mode Tabs */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#23232a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#e9c176] text-xl">
              {activeMode === 'display_qr' ? 'qr_code_2' : 'qr_code_scanner'}
            </span>
            <h3 className="font-headline text-[15px] sm:text-[16px] font-semibold text-[#ffdea5]">
              {activeMode === 'display_qr' ? 'QR Tamu & RSVP Digital' : 'Scan Tiket Undangan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Mode Selector Switcher */}
        <div className="p-2.5 bg-[#17171c] border-b border-white/10 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-[11.5px] font-semibold">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setActiveMode('display_qr');
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'display_qr'
                  ? 'bg-[#775a19] text-white shadow-sm font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
              <span>Tampilkan QR Tamu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setActiveMode('scan_camera');
              }}
              className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'scan_camera'
                  ? 'bg-[#775a19] text-white shadow-sm font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>Scan via Kamera</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TAMPILKAN QR TAMU (UNTUK DI-SCAN DENGAN KAMERA MOBILE TAMU) */}
        {activeMode === 'display_qr' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center text-center space-y-4 font-body">
            
            {/* Standee Wedding Card Preview */}
            <div className="w-full bg-gradient-to-b from-[#2b2721] via-[#201c18] to-[#171513] border-2 border-[#c5a059]/60 rounded-2xl p-4 sm:p-5 shadow-2xl relative text-white flex flex-col items-center">
              
              {/* Corner decorative ornaments */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#ffdea5]/70 rounded-tl-sm"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#ffdea5]/70 rounded-tr-sm"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#ffdea5]/70 rounded-bl-sm"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#ffdea5]/70 rounded-br-sm"></div>

              {/* Monogram & Title */}
              <div className="w-9 h-9 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 flex items-center justify-center mb-1.5">
                <span className="font-headline text-[13px] font-bold text-[#ffdea5]">K &amp; C</span>
              </div>

              <h4 className="font-headline text-[17px] font-bold tracking-tight text-[#ffdea5] leading-tight">
                The Wedding of Kevin &amp; Clarissa
              </h4>
              <p className="text-[11px] text-white/75 mt-0.5">
                Grand Ballroom Hotel Mulia • 20 September 2026
              </p>

              {/* Real Scannable QR Code Image */}
              <div className="my-3.5 p-3.5 bg-white rounded-2xl shadow-xl border-2 border-[#ffdea5]/40 flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code RSVP Tamu"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-500">
                    <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                  </div>
                )}
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdea5] text-[#261900] text-[10.5px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">camera_alt</span>
                  <span>Scan Kamera HP</span>
                </div>
              </div>

              <div className="text-center space-y-1 max-w-xs">
                <p className="text-[12.5px] font-bold text-white">
                  Arahkan Kamera HP ke QR Code
                </p>
                <p className="text-[11px] text-white/70 leading-snug">
                  Membuka formulir RSVP kehadiran, doa restu, amplop digital, &amp; kupon souvenir secara mandiri.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="w-full space-y-2 pt-1">
              {/* Open RSVP Form Directly */}
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  if (onOpenRSVP) onOpenRSVP();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#775a19] to-[#92484f] hover:from-[#634b15] hover:to-[#7a353d] text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>Buka Form RSVP Sekarang</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-semibold flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#ffdea5]">
                    {copiedLink ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedLink ? 'Tersalin!' : 'Salin Link RSVP'}</span>
                </button>

                {/* Print Standee */}
                <button
                  type="button"
                  onClick={handlePrintStandee}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-semibold flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#ffdea5]">print</span>
                  <span>Cetak Standee QR</span>
                </button>
              </div>

              <div className="text-[10.5px] text-white/50 text-center truncate pt-1">
                URL: {rsvpUrl}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SCANNER CAMERA (RECEPTIONIST MODE) */}
        {activeMode === 'scan_camera' && (
          <div className="flex flex-col">
            {/* Viewfinder with Live Video */}
            <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:16px_16px]"></div>
              )}

              {/* Camera Error / Notice */}
              {cameraError && (
                <div className="absolute top-2 inset-x-2 p-2 rounded-lg bg-black/75 text-[10.5px] text-amber-300 text-center border border-amber-500/30 backdrop-blur-xs z-10">
                  {cameraError}
                </div>
              )}

              {/* Scanner Box Target */}
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 border-2 border-[#c5a059] rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(197,160,89,0.35)] z-10">
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#ffdea5] rounded-tl-md"></span>
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#ffdea5] rounded-tr-md"></span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#ffdea5] rounded-bl-md"></span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#ffdea5] rounded-br-md"></span>

                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#ffdea5] to-transparent animate-pulse shadow-[0_0_10px_#c5a059]"></div>

                {!cameraActive && (
                  <div className="flex flex-col items-center gap-1 text-white/70">
                    <span className="material-symbols-outlined text-4xl text-[#c5a059]">qr_code_2</span>
                    <span className="text-[11px] font-medium tracking-wide">Arahkan ke Tiket QR</span>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-[#ffdea5] z-20">
                  <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                  <span className="text-xs font-semibold">Membaca data undangan tamu...</span>
                </div>
              )}
            </div>

            {/* Upload QR File or Select Preset */}
            <div className="p-3 bg-[#23232a] flex flex-col gap-2 border-t border-white/10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/70 font-semibold">Opsi Pemindaian:</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#e9c176] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">file_upload</span>
                  Unggah Gambar QR
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto no-scrollbar pt-1">
                <span className="text-[10px] text-white/50">Simulasi Tap Tiket Undangan:</span>
                {demoInvitations.map((inv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulateScan(inv)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-[#c5a059]/20 text-left flex items-center justify-between transition-all border border-white/10"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-white truncate">{inv.name}</span>
                      <span className="text-[10px] text-white/60">{inv.origin}</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#e9c176]">bolt</span>
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
