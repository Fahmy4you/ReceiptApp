'use client';
import React, { FC, Dispatch, SetStateAction, ReactNode, useEffect, useState } from 'react';
import { 
  LuArrowLeft as ArrowLeft, 
  LuImage as LucideImage, 
  LuPrinter as Printer, 
  LuLoader as Loader2, 
  LuFileText as FileText,
  LuShare2 as ShareIcon,
  LuBluetooth
} from 'react-icons/lu';
import { calculateReceiptTotal, cleanCurrencyInput, formatIDR, formatReceiptDate } from '@/lib/Helpers';
import { usePrinter } from '@/context/PrinterContext';
import { printImageToThermal } from '@/lib/PrinterThermal';
import { DEFAULT_NAME_APP, fontConfig, fontInternal, weightConstanta } from '@/lib/constanta';
import { ReceiptElement, SettingsData } from '@/lib/types';
import { DownloadStruk, generateStrukBlob } from '@/lib/Download';
import { signIn, useSession } from 'next-auth/react';
import Toast from './Toast';

interface PreviewPageProps {
  show: boolean;
  onClose: () => void;
  config: ReceiptElement[];
  formData: Record<string, any>;
  setFormData: Dispatch<SetStateAction<Record<string, any>>>;
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  settings: SettingsData | null;
}

const normalizeKey = (label?: string): string => {
  if (!label) return "unknown_field";
  return label.toLowerCase().trim().replace(/\s+/g, '_');
};

const PreviewPage: FC<PreviewPageProps> = ({
  show,
  onClose,
  config,
  formData,
  setFormData,
  isGenerating,
  setIsGenerating,
  settings
}) => {
  const { printerDevice, setPrinterDevice, isPrinterConnected, setIsPrinterConnected } = usePrinter();
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await DownloadStruk(formData, config);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch(err: any) {
      setToast({
          type: 'error',
          title: 'Gagal',
          message: err?.message || err?.toString() || "Terjadi kesalahan"
      });
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const connectPrinter = async () => {
    setIsGenerating(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      await device.gatt.connect();
      setPrinterDevice(device);
      setIsPrinterConnected(true);
      localStorage.setItem('last_printer_name', device.name || 'Printer');
      return device;
    } catch (e) {
      setToast({ type: 'error', title: 'Error', message: "Gagal menghubungkan printer coba lagi" });
      console.error(e);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintFisik = async () => {
    setIsGenerating(true);
    if (!printerDevice) {
      try {
        const printer = await connectPrinter();
        if(!printer) {
          setToast({ type: 'error', title: 'Error', message: "Gagal menghubungkan printer coba lagi" });
          setIsGenerating(false)
          return;
        }
      } catch(err) {
        setToast({ type: 'error', title: 'Error', message: "Gagal menghubungkan printer coba lagi" });
        console.error(err)
        setIsGenerating(false)
        return;
      }
    };

    try {
      const response = await fetch('/api/cetak_struk', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, config, format: 'png', print: true })
      });

      if (!response.ok) throw new Error("Gagal mengambil data dari server");

      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await printImageToThermal(printerDevice, base64data);
        setIsGenerating(false);
      };
      
    } catch (error: any) {
      console.error("Gagal cetak via API:", error);
      setToast({
          type: 'error',
          title: 'Gagal',
          message: "Gagal mencetak: " + (error.message || "Periksa koneksi server.")
      });
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      await DownloadStruk(formData, config, 'png');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch(err: any) {
      setToast({
          type: 'error',
          title: 'Gagal',
          message: err?.message || err?.toString() || "Terjadi kesalahan"
      });
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fungsi Share dengan Web Share API modern (bisa ke WA, Telegram, dll)
  const handleShareStruk = async () => {
    setIsGenerating(true);
    try {
      // Dapatkan file Blob gambar PNG dari fungsi DownloadStruk bawaanmu
      const blob = await generateStrukBlob(formData, config, 'png');
      
      if (!blob) {
        throw new Error("Gagal memproses file gambar");
      }

      const file = new File([blob], 'struk_pembayaran.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Struk Pembayaran',
          text: 'Berikut adalah struk bukti pembayaran digital Anda.',
        });
      } else {
        // Fallback jika browser/perangkat tidak mendukung native sharing
        alert("Fitur share langsung tidak didukung di browser ini. Silakan simpan sebagai gambar terlebih dahulu.");
      }
    } catch (error) {
      console.error("Gagal membagikan file:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!config || !Array.isArray(config)) return;

    const sanitizedFormData = { ...formData };

    config.forEach(element => {
      const isCurrencyElement = 
        element.dataType === 'Currency' || 
        element.dataType === 'Admin_Fee' ||
        element.dataType === 'total_keseluruhan' ||
        element.label?.toUpperCase().includes('NOMINAL') || 
        element.label?.toUpperCase().includes('ADMIN');

      if (isCurrencyElement) {
        const key = normalizeKey(element.label);
        if (formData[key]) {
          sanitizedFormData[key] = cleanCurrencyInput(formData[key]);
        }
      }
    });

    const { updates } = calculateReceiptTotal({ config, formData: sanitizedFormData, settings });

    setFormData(prev => {
      const isDifferent = Object.keys(updates).some(k => prev[k] !== updates[k]);
      if (!isDifferent) return prev;
      return { ...prev, ...updates };
    });

  }, [
      formData[normalizeKey(config?.find(el => el.dataType === 'Currency' || el.dataType === 'Nominal')?.label || "")], 
      formData[normalizeKey(config?.find(el => el.dataType === 'Admin_Fee')?.label || "")],
      formData[normalizeKey(config?.find(el => el.dataType === 'Referensi')?.label || "")],
      formData.showAdmin,
      settings,
      config
  ]);
  

  const renderElement = (element: any) => {
    const mTop = `${element.marginTop ?? 0}px`;
    const mBottom = `${element.marginBottom ?? 0}px`;

    switch (element.type) {
      case 'input_image':
        if(element.source == 'logo') {
          if(!settings) return null;
          if (!settings.logo || settings.logo == "") return null;
          return (
            <div key={element.id} className="flex flex-col items-center gap-[5px]" style={{ marginTop: mTop, marginBottom: mBottom }}>
              <img 
                src={settings.logo} 
                style={{ width: `${element.width || 100}px`, height: 'auto' }}
                className="grayscale contrast-[1.5] brightness-100" 
                alt="Logo"
              />
            </div>
          );
        } else {
          return (
            <div key={element.id} className="flex flex-col items-center gap-[5px]" style={{ marginTop: mTop, marginBottom: mBottom }}>
               {element.value ? (
                  <img 
                    src={element.value} 
                    style={{ width: `${element.width || 100}px`, height: 'auto' }}
                    className="grayscale contrast-[1.5] brightness-100" 
                    alt="Logo"
                  />
               ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                    <LucideImage className="text-slate-300" />
                  </div>
               )}
            </div>
          );
        }

      case 'text':
        return (
          <div
            key={element.id}
            contentEditable
            suppressContentEditableWarning
            suppressHydrationWarning
            translate='no'
            style={{
              fontSize: `${element.fontSize || 14}px`,
              textAlign: element.alignment || 'center',
              fontWeight: weightConstanta[element.fontWeight as CustomFontWeight] || 400,
              color: element.color || '#000',
              border: element.hasBorder ? '2px solid #000' : 'none',
              padding: element.hasBorder ? '5px' : '0',
              marginTop: mTop,
              marginBottom: mBottom,
              letterSpacing: `${element.letterSpacing ?? 0}px`,
              wordBreak: "break-word"
            }}
            className="outline-none focus:bg-yellow-50 leading-tight"
          >
            {element.value}
          </div>
        );

      case 'input_text':
        const key = normalizeKey(element.label);
        const hasValue = formData[key] != undefined && formData[key] != null && formData[key] != '' && formData[key] != "null";
        const rawValue = hasValue ? formData[key] : '-';

        const isCurrency = 
          element.dataType === 'Currency' || 
          element.dataType === 'Admin_Fee' ||
          element.dataType === 'total_keseluruhan' ||
          element.label?.toUpperCase().includes('NOMINAL') || 
          element.label?.toUpperCase().includes('ADMIN');

        let displayValue = rawValue;

        if (isCurrency && rawValue != '-') {
          const angkaBersih = cleanCurrencyInput(rawValue); 
          displayValue = `Rp ${formatIDR(angkaBersih)}`;   
        }

        const isStacked = element.labelLayout === 'stacked';
        const rowGap = `${element.gap ?? 12}px`;
        
        const isDate = element.dataType === 'Date';
        if(isDate && rawValue != '-') {
          displayValue = formatReceiptDate(rawValue);
        }

        let textCaseClass = "";
        if (formData.textCase === 'uppercase') {
          textCaseClass = "uppercase";
        } else if (formData.textCase === 'lowercase') {
          textCaseClass = "lowercase";
        } else if (formData.textCase === 'normal') {
          textCaseClass = isCurrency ? "" : "capitalize";
        }

        // ADAPTASI LOGIKA LAYOUT FLEXBOX DAN ALIGNMENT BARU
        let justifyClass = 'justify-between'; 
        let alignClass = 'items-baseline';
        let textAlignment: 'left' | 'center' | 'right' | 'justify' = 'left';

        if (isStacked) {
          alignClass = 'items-stretch';
          if (element.position === 'left') { justifyClass = 'items-start'; textAlignment = 'left'; }
          else if (element.position === 'center') { justifyClass = 'items-center'; textAlignment = 'center'; }
          else if (element.position === 'default') { justifyClass = 'items-end'; textAlignment = 'right'; }
          else { justifyClass = 'items-stretch'; textAlignment = 'justify'; }
        } else {
          if (element.position === 'left') { justifyClass = 'justify-start'; textAlignment = 'left'; }
          else if (element.position === 'center') { justifyClass = 'justify-center'; textAlignment = 'center'; }
          else if (element.position === 'default') { justifyClass = 'justify-end'; textAlignment = 'right'; }
          else { justifyClass = 'justify-between'; textAlignment = 'left'; }
        }

        return (
          <div 
            key={element.id} 
            className={`flex leading-[1.1] ${isStacked ? 'flex-col' : ''} ${justifyClass} ${alignClass}`}
            style={{
              color: element.color || '#000',
              border: element.hasBorder ? `2px solid ${element.color || '#000'}` : 'none',
              padding: element.hasBorder ? '8px' : '0',
              marginTop: mTop,
              marginBottom: mBottom,
              gap: rowGap
            }}
          >
            {element.showLabel && element.label && (
              <span 
                suppressHydrationWarning
                translate='no'
                className={`uppercase ${isStacked ? 'text-[0.85em]' : ''}`}
                style={{ 
                  fontSize: `${element.labelFontSize || 12}px`,
                  fontWeight: weightConstanta[element.labelFontWeight as CustomFontWeight] || 400,
                  letterSpacing: `${element.labelLetterSpacing ?? 0}px`,
                  textAlign: textAlignment === 'justify' ? 'left' : textAlignment
                }}
              >
                {element.label}
              </span>
            )}
            <span 
              contentEditable 
              suppressContentEditableWarning
              suppressHydrationWarning
              translate='no'
              onBlur={(e) => {
                const rawText = e.currentTarget?.innerText || '';
                const finalValue = isCurrency ? cleanCurrencyInput(rawText) : rawText;
                setFormData(prev => ({ ...prev, [key]: finalValue }));
              }}
              className={`outline-none focus:bg-yellow-50 ${textCaseClass}`}
              style={{ 
                fontSize: `${element.valueFontSize || 12}px`,
                fontWeight: weightConstanta[element.valueFontWeight as CustomFontWeight] || 400,
                letterSpacing: `${element.valueLetterSpacing ?? 0}px`,
                textAlign: element.position === 'justify' && !isStacked ? 'right' : textAlignment,
                wordBreak: "break-word"
              }}
            >
              {displayValue}
            </span>
          </div>
        );

      case 'separator':
        const lineThickness = `${element.thickness ?? 2}px`; 

        if (element.style === 'double_line') {
          return (
            <div key={element.id} className="w-full flex flex-col justify-between" style={{ marginTop: mTop, marginBottom: mBottom, height: `calc(${lineThickness} * 2 + 0.5px)` }}>
              <div style={{ borderTop: `${lineThickness} solid ${element.color || '#000'}` }}></div>
              <div style={{ borderTop: `${lineThickness} solid ${element.color || '#000'}` }}></div>
            </div>
          );
        }
        
        if (element.style === 'double_dash') {
          return (
            <div key={element.id} className="w-full flex flex-col justify-between" style={{ marginTop: mTop, marginBottom: mBottom, height: `calc(${lineThickness} * 2 + 0.5px)` }}>
              <div style={{ borderTop: `${lineThickness} dashed ${element.color || '#000'}` }}></div>
              <div style={{ borderTop: `${lineThickness} dashed ${element.color || '#000'}` }}></div>
            </div>
          );
        }

        return (
          <div 
            key={element.id} 
            className="w-full" 
            style={{ 
              borderTop: `${lineThickness} ${element.style === 'dash' ? 'dashed' : 'solid'} ${element.color || '#000'}`,
              marginTop: mTop,
              marginBottom: mBottom
            }} 
          />
        );

      default:
        return null;
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-slate-950 animate-in fade-in duration-200">
      {toast && (
          <Toast toast={toast} setToast={setToast} />
      )}
      {/* 1. TOP BAR / NAVBAR */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-8 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-full transition text-slate-700 dark:text-slate-300 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-tight">Kembali</span>
          </button>
          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white uppercase text-xs md:text-sm tracking-tight leading-none">Halaman Pratinjau</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-semibold hidden sm:block">Format keluaran kertas Thermal 58mm</p>
          </div>
        </div>

        <div className="bg-black text-white text-[9px] md:text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
          Thermal 58mm Mode
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-[76px] lg:pb-0">
        
        {/* Sisi Kiri / Atas (Mobile): Area Kertas Struk */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-900 p-4 md:p-10 overflow-y-auto flex justify-center items-start custom-scrollbar">
          {/* THE RECEIPT CONTAINER */}
          <div className="receipt-paper-thermal my-auto shadow-2xl">
            <style>{`
            ${fontInternal.map(font => 
              font.variants.map(variant => `
                @font-face {
                  font-family: '${font.name}';
                  src: url('${variant.path}') format('truetype');
                  font-weight: ${variant.weight};
                  font-style: normal;
                }
              `).join('\n')
            ).join('\n')}
              .receipt-paper-thermal {
                background-color: #ffffff;
                width: 219px;
                padding: 25px 18px;
                position: relative;
                color: #000;
                box-sizing: border-box;
                font-family: '${fontConfig.name}', ${fontConfig.fallback};
                font-variant-numeric: slashed-zero;
              }
              .receipt-paper-thermal::before {
                content: ""; position: absolute; top: -8px; left: 0; width: 100%; height: 8px;
                background: linear-gradient(-45deg, #ffffff 6px, transparent 0), linear-gradient(45deg, #ffffff 6px, transparent 0);
                background-position: left bottom; background-repeat: repeat-x; background-size: 8px 8px;
              }
              .receipt-paper-thermal::after {
                content: ""; position: absolute; bottom: -8px; left: 0; width: 100%; height: 8px;
                background: linear-gradient(-45deg, transparent 6px, #ffffff 0), linear-gradient(45deg, transparent 6px, #ffffff 0);
                background-position: left top; background-repeat: repeat-x; background-size: 8px 8px;
              }
              .custom-scrollbar::-webkit-scrollbar { width: 5px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
            `}</style>

            {/* DYNAMIC CONTENT */}
            {config.map((element: any) => renderElement(element))}
          </div>
        </div>

        {/* 3. RESPONSIVE ACTION PANEL */}
        {/* Di HP: baris fixed melayang tipis di bagian bawah screen, Di Desktop: Sidebar kanan */}
        <div className="fixed bottom-0 left-0 right-0 lg:relative w-full lg:w-[380px] p-3 lg:p-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md lg:backdrop-blur-none border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:shadow-none flex-shrink-0">
          <div className="space-y-4 w-full">
            <div className="hidden lg:block mb-4">
              <h5 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-wider">Opsi Penyimpanan & Cetak</h5>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-bold">Pilih metode ekspor data di bawah ini</p>
            </div>

            {!isAuthenticated && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-center space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Login untuk menyimpan & mencetak struk</p>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/upload" })}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Login dengan Google
                </button>
              </div>
            )}

            {/* Di HP: flex-row rapat (hanya icon), Di Desktop: flex-col memanjang */}
            <div className="flex flex-row lg:flex-col justify-center items-center gap-2 md:gap-3 w-full max-w-md mx-auto lg:max-w-none">
              <ActionButton 
                onClick={handleDownloadPDF} 
                loading={isGenerating} 
                icon={<FileText/>} 
                title="Simpan PDF" 
                desc="Kualitas standar thermal"
                color="blue"
                locked={!isAuthenticated}
              />
              <ActionButton 
                onClick={handleDownloadImage} 
                loading={isGenerating} 
                icon={<LucideImage/>} 
                title="Simpan Gambar" 
                desc="Format PNG Contrast Tinggi"
                color="purple"
                locked={!isAuthenticated}
              />
              <ActionButton 
                onClick={handleShareStruk} 
                loading={isGenerating} 
                icon={<ShareIcon/>} 
                title="Bagikan Struk" 
                desc="Kirim ke WhatsApp / Sosmed"
                color="teal"
                locked={!isAuthenticated}
              />
              <ActionButton 
                onClick={handlePrintFisik} 
                loading={isGenerating} 
                icon={printerDevice ? <Printer/> : <LuBluetooth/>} 
                title="Cetak Langsung" 
                desc={printerDevice ? "Kirim ke Printer Thermal" : "Printer belum terhubung"}
                color={printerDevice ? "green" : "gray"}
                locked={!isAuthenticated}
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-900 hidden lg:block">
            <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">{process.env.NEXT_PUBLIC_NAME_APP ?? DEFAULT_NAME_APP}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

type CustomFontWeight = keyof typeof weightConstanta;

interface ActionButtonProps {
  onClick: () => void;
  loading?: boolean;
  icon: ReactNode;
  title: string;
  desc: string;
  color: 'blue' | 'purple' | 'green' | 'gray' | 'teal';
  disabled?: boolean;
  locked?: boolean;
}

const ActionButton: FC<ActionButtonProps> = ({ onClick, loading, icon, title, desc, color, disabled, locked }) => {
  const themes = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white dark:bg-purple-900/20 dark:text-purple-400",
    green: "bg-green-50 text-green-700 hover:bg-green-600 hover:text-white dark:bg-green-900/20 dark:text-green-400",
    teal: "bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white dark:bg-teal-900/20 dark:text-teal-400",
    gray: "bg-gray-50 text-gray-700 hover:bg-gray-600 hover:text-white dark:bg-gray-800/20 dark:text-gray-400"
  };

  return (
    <button 
      onClick={locked ? undefined : onClick}
      disabled={disabled || loading || locked}
      title={locked ? "Login dulu untuk menggunakan fitur ini" : title}
      className={`flex items-center cursor-pointer disabled:cursor-not-allowed justify-center lg:justify-start gap-4 flex-1 lg:flex-none w-12 h-12 lg:w-full lg:h-20 pl-0 lg:pl-5 rounded-full lg:rounded-3xl transition-all duration-300 text-left disabled:opacity-50 group overflow-hidden flex-shrink-0 ${themes[color]}`}
    >
      {/* Icon Wrapper */}
      <div className="w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-full lg:rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
        {loading ? (
          <Loader2 className="animate-spin" size={18}/>
        ) : (
          <div className="flex items-center justify-center [&_svg]:!w-5 [&_svg]:!h-5">
            {icon}
          </div>
        )}
      </div>
      
      <div className="hidden lg:flex flex-col justify-center min-w-0">
        <div className="text-xs font-black uppercase tracking-tight truncate">{locked ? "Login Diperlukan" : title}</div>
        <div className="text-[10px] opacity-70 font-bold truncate">{locked ? "Login untuk menyimpan & mencetak" : desc}</div>
      </div>
    </button>
  );
};

export default PreviewPage;