'use client';
import Toast from '@/components/Toast';
import { usePrinter } from '@/context/PrinterContext';
import { useTheme } from '@/context/ThemeContext';
import { AdminRange, SettingsData } from '@/lib/types';
import { upsertSettingsAction } from '@/models/Settings';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { 
  LuStore as Store, 
  LuImage as ImageIcon, 
  LuHash as Hash, 
  LuSave as Save, 
  LuUpload as Upload, 
  LuInfo as Info, 
  LuCheck as Check, 
  LuPlus as Plus, 
  LuTrash2 as Trash2, 
  LuLayers as Layers, 
  LuCalculator as Calculator, 
  LuTarget as Target, 
  LuX as X,
  LuPrinter as Printer,
  LuBluetooth as Bluetooth,
  LuBluetoothOff as BluetoothOff,
  LuRefreshCw as RefreshCw,
  LuTrash as Trash,
  LuMonitor,
  LuMoon,
  LuSun
} from 'react-icons/lu';

const PageSettingsClient: React.FC<{ initialData?: SettingsData }> = ({ initialData }) => {
  // --- States ---
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const session = useSession();
  
  // Data State
  const [shopName, setShopName] = useState(initialData?.shopName || 'StrukApp Digital');
  const [alamat, setAlamat] = useState(initialData?.alamat || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  
  const [adminType, setAdminType] = useState(initialData?.adminFee?.type || 'fixed');
  const [fixedFee, setFixedFee] = useState(initialData?.adminFee?.fixedValue || 2500);
  const [ranges, setRanges] = useState<AdminRange[]>(initialData?.adminFee?.ranges || []);
  const [multiplier, setMultiplier] = useState(initialData?.adminFee?.multiplier || { step: 10000, fee: 2500 });
  
  // Modal State untuk Input Range Baru
  const [newRange, setNewRange] = useState({ 
    min: '', 
    max: '', 
    fee: '' 
  });
  
  const [refType, setRefType] = useState(initialData?.reference?.type || 'full');
  const [digitLimit, setDigitLimit] = useState(initialData?.reference?.digitLimit || 8);

  // Context Printer State
  const [isSearching, setIsSearching] = useState(false);
  const { printerDevice, setPrinterDevice, isPrinterConnected, setIsPrinterConnected } = usePrinter();
  const {theme, setTheme} = useTheme();

  // --- LOGIKA AUTO RECONNECT SETELAH REFRESH ---
  useEffect(() => {
    const autoReconnectPrinter = async () => {
      // Melakukan casting navigator ke any agar tidak error TS(2339)
      const navBluetooth = (navigator as any).bluetooth;
      
      if (navBluetooth && navBluetooth.getDevices) {
        try {
          const devices = await navBluetooth.getDevices();
          const lastPrinterName = localStorage.getItem('last_printer_name');
          
          const matchedDevice = devices.find((d: any) => d.name === lastPrinterName);
          
          if (matchedDevice && !matchedDevice.gatt.connected) {
            setIsSearching(true);
            await matchedDevice.gatt.connect();
            setPrinterDevice(matchedDevice);
            setIsPrinterConnected(true);
          }
        } catch (error) {
          setToast({ type: 'error', title: 'Error', message: "Gagal melakukan auto-reconnect printer" });
          console.error("Gagal melakukan auto-reconnect printer:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };

    if (!isPrinterConnected) {
      autoReconnectPrinter();
    }
  }, [isPrinterConnected, setPrinterDevice, setIsPrinterConnected]);

  // --- BLUETOOTH CONNECT ---
  const connectPrinter = async () => {
    setIsSearching(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      await device.gatt.connect();
      setPrinterDevice(device);
      setIsPrinterConnected(true);
      localStorage.setItem('last_printer_name', device.name || 'Printer');
    } catch (e) {
      setToast({ type: 'error', title: 'Error', message: "Gagal menghubungkan printer coba lagi" });
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const disconnectPrinter = () => {
    if (printerDevice?.gatt?.connected) printerDevice.gatt.disconnect();
    setIsPrinterConnected(false);
    setPrinterDevice(null);
    localStorage.removeItem('last_printer_name');
  };

  // --- Handlers ---
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setToast({ type: 'error', title: 'Error', message: "File terlalu besar! Maksimal 2MB" });
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addRange = () => {
    const minVal = Number(newRange.min);
    const maxVal = newRange.max !== '' ? Number(newRange.max) : null;
    const feeVal = Number(newRange.fee);

    if (newRange.min === '' || newRange.fee === '') {
      setToast({ type: 'error', title: 'Error', message: "Min dan Fee wajib diisi" });
      return;
    }

    if (maxVal !== null && maxVal <= minVal) {
      setToast({ type: 'error', title: 'Error', message: "Max harus lebih besar dari Min" });
      return;
    }

    const isOverlapping = ranges.some(r => {
      const existingMin = r.min;
      const existingMax = r.max === null ? Infinity : r.max;
      const currentMin = minVal;
      const currentMax = maxVal === null ? Infinity : maxVal;
      return currentMin <= existingMax && currentMax >= existingMin;
    });

    if (isOverlapping) {
      setToast({ 
        type: 'error', 
        title: 'Error', 
        message: "Rentang harga tumpang tindih dengan aturan yang sudah ada!" 
      });
      return;
    }

    const range: AdminRange = {
      id: Math.random().toString(36).substring(2, 9),
      min: minVal,
      max: maxVal,
      fee: feeVal
    };

    setRanges((prev) => [...prev, range].sort((a, b) => a.min - b.min));
    setNewRange({ min: '', max: '', fee: '' });
    setShowModal(false);
    setToast(null);
  };

  const removeRange = (id: string) => {
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    let finalLogoPath = logoPreview;
    if(session.status != 'authenticated') {
      setToast({ type: 'error', title: 'Error', message: "Anda harus login untuk menyimpan pengaturan" });
      setLoading(false);
      return;
    }

    try {
      if (logoPreview && logoPreview.startsWith("data:")) {
        const uploadRes = await fetch("/api/upload_image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64: logoPreview,
            category: "logo",
          }),
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || "Gagal Upload Logo");
        }

        const uploadData = await uploadRes.json();
        finalLogoPath = uploadData.path;
      }

      const finalJson: SettingsData = {
        shopName,
        alamat,
        logo: finalLogoPath,
        adminFee: {
          type: adminType,
          fixedValue: fixedFee,
          ranges: ranges,
          multiplier: multiplier
        },
        reference: {
          type: refType,
          digitLimit: digitLimit
        }
      };
      // console.log(finalJson)
      const result = await upsertSettingsAction({ data: finalJson });

      if (result.success) {
        setToast({ 
          type: 'success', 
          title: 'Success', 
          message: "Pengaturan berhasil disimpan dan file lama telah dibersihkan!" 
        });
        setLogoPreview(finalLogoPath); 
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      setToast({ 
        type: 'error', 
        title: 'Error', 
        message: error.message || "Terjadi kesalahan saat menyimpan." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Pengaturan Sistem
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Konfigurasi identitas, biaya admin, dan format struk digital.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <span className="animate-spin mr-2">◌</span> : <Save size={18} />}
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </header>

      {toast && (
          <div ref={errorRef}>
              <Toast toast={toast} setToast={setToast} />
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* IDENTITAS TOKO */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <Store className="text-blue-500" size={20} />
              <h2 className="font-bold text-zinc-800 dark:text-zinc-200">Identitas Toko</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Nama Toko</label>
                <input 
                  type="text" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Alamat Toko</label>
                <input 
                  type="text" 
                  value={alamat ?? ''}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* SKEMA BIAYA ADMIN */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <Calculator className="text-emerald-500" size={20} />
              <h2 className="font-bold text-zinc-800 dark:text-zinc-200">Skema Biaya Admin</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { id: 'fixed', label: 'Tetap', icon: Target, desc: 'Biaya flat' },
                { id: 'range', label: 'Rentang', icon: Layers, desc: 'Tangga harga' },
                { id: 'multiplier', label: 'Kelipatan', icon: Calculator, desc: 'Per kelipatan' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAdminType(item.id as any)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                    adminType === item.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                  }`}
                >
                  <item.icon size={20} className={adminType === item.id ? 'text-blue-500' : 'text-zinc-400'} />
                  <div>
                    <p className="font-bold text-sm dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              {adminType === 'fixed' && (
                <div className="space-y-2 max-w-sm">
                  <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Nominal Admin Tetap</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Rp</span>
                    <input 
                      type="number" 
                      value={fixedFee}
                      onChange={(e) => setFixedFee(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    />
                  </div>
                </div>
              )}

              {adminType === 'range' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Atur Rentang</label>
                    <button 
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-2 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      <Plus size={14} /> Rentang
                    </button>
                  </div>
                  
                  {ranges.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <Layers size={32} className="mx-auto text-zinc-300 mb-2" />
                      <p className="text-sm text-zinc-400">Belum ada rentang biaya.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ranges.map((r) => (
                        <div key={r.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group">
                          <div>
                            <p className="text-[10px] font-bold text-blue-500 uppercase">Rentang</p>
                            <p className="text-sm font-bold dark:text-white">
                              Rp {r.min.toLocaleString()} - {r.max ? `Rp ${r.max.toLocaleString()}` : '∞'}
                            </p>
                            <p className="text-xs text-zinc-400">Admin: Rp {r.fee.toLocaleString()}</p>
                          </div>
                          <button 
                            onClick={() => removeRange(r.id)}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {adminType == 'multiplier' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Setiap Kelipatan Harga</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Rp</span>
                      <input 
                        type="number" 
                        value={multiplier.step}
                        onChange={(e) => setMultiplier({...multiplier, step: Number(e.target.value)})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Biaya Admin</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Rp</span>
                      <input 
                        type="number" 
                        value={multiplier.fee}
                        onChange={(e) => setMultiplier({...multiplier, fee: Number(e.target.value)})}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* FORMAT REFERENSI */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
              <Hash className="text-purple-500" size={20} />
              <h2 className="font-bold text-zinc-800 dark:text-zinc-200">Format Referensi Struk</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setRefType('full')}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${refType === 'full' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-zinc-100 dark:border-zinc-800'}`}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-bold text-sm dark:text-white">Tampilan Penuh</span>
                  {refType === 'full' && <Check size={16} className="text-blue-500" />}
                </div>
                <code className="text-[10px] text-zinc-400">STR-20240507-ABCDEF123</code>
              </button>

              <button 
                onClick={() => setRefType('limited')}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${refType === 'limited' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-zinc-100 dark:border-zinc-800'}`}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-bold text-sm dark:text-white">Batasi Digit</span>
                  {refType === 'limited' && <Check size={16} className="text-blue-500" />}
                </div>
                <code className="text-[10px] text-zinc-400">Hanya mengambil X digit terakhir</code>
              </button>
            </div>

            {refType === 'limited' && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Jumlah Digit Terakhir</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="4" max="16" step="1"
                    value={digitLimit}
                    onChange={(e) => setDigitLimit(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-sm min-w-[3rem] text-center">
                    {digitLimit}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* KOLOM KANAN */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm top-6">
            <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-6">Logo Perusahaan</label>
            <div className="relative group mx-auto w-40 h-40 mb-6">
              <div className="w-full h-full rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon size={48} className="text-zinc-300 dark:text-zinc-600" />
                )}
              </div>
              {logoPreview ? (
                <button onClick={() => setLogoPreview(null)} className="absolute -bottom-2 -right-2 bg-red-600 text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:bg-red-700 transition-all hover:scale-110 active:scale-95">
                  <Trash size={20} />
                </button>
              ) : (
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:bg-blue-700 transition-all hover:scale-110 active:scale-95">
                  <Upload size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              )}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-start gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <Info size={14} className="text-blue-500 shrink-0" />
                <p>Logo ini akan muncul di bagian header setiap struk yang dicetak atau dibagikan.</p>
              </div>
              <div className="flex items-start gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <FiAlertCircle size={14} className="text-amber-500 shrink-0" />
                <p>Gunakan gambar PNG transparan untuk hasil terbaik</p>
              </div>
              <div className="flex items-start gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <FiAlertCircle size={14} className="text-amber-500 shrink-0" />
                <p>Maksimal ukuran logo 2mb</p>
              </div>
            </div>
          </div>
          
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
              <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
                <Printer className="text-blue-600" size={20} />
                <h2 className="font-bold">Printer Fisik</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-800/30">
                  {isPrinterConnected ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/10">
                        <Bluetooth size={32} />
                      </div>
                      <p className="font-bold">{printerDevice?.name || 'Unknown'}</p>
                      <p className="text-xs text-green-500 font-semibold uppercase tracking-wider mt-1">Terhubung</p>
                    </div>
                  ) : (
                    <div className="text-center text-zinc-400 dark:text-zinc-600">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        {isSearching ? <RefreshCw className="animate-spin text-blue-500" size={32} /> : (printerDevice?.name ? <BluetoothOff size={32} /> : <Printer size={32} />)}
                      </div>
                      <p className="font-bold text-zinc-500 dark:text-zinc-400">{printerDevice?.name || 'Belum Ada Printer'}</p>
                      <p className="text-[10px] uppercase mt-1">Status: Offline</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={isPrinterConnected ? disconnectPrinter : connectPrinter}
                  disabled={isSearching}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    isPrinterConnected 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                  }`}
                >
                  {isSearching ? <RefreshCw className="animate-spin" size={18} /> : isPrinterConnected ? <BluetoothOff size={18} /> : <Bluetooth size={18} />}
                  {isSearching ? 'Mencari...' : isPrinterConnected ? 'Putuskan Koneksi' : 'Hubungkan Printer'}
                </button>
              </div>
          </section>

          <div className="relative bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl flex items-center justify-between border border-transparent dark:border-zinc-800">
                        
            {/* Sliding Background Indicator */}
            <div 
              className={`absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-zinc-900 shadow-md border border-slate-200/40 dark:border-zinc-700/50 transition-all duration-500 ease-out`}
              style={{
                left: theme === 'light' ? '6px' : theme === 'dark' ? '33.8%' : '66.8%',
                width: '31.5%'
              }}
            />

            {/* Opsi 1: Light */}
            <button
              onClick={() => setTheme('light')}
              className={`relative cursor-pointer z-10 w-[32%] py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors ${
                theme === 'light' 
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <LuSun className={`w-4 h-4 ${theme === 'light' ? 'animate-bounce' : ''}`} />
              <span>Terang</span>
            </button>

            {/* Opsi 2: Dark */}
            <button
              onClick={() => setTheme('dark')}
              className={`relative cursor-pointer z-10 w-[32%] py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors ${
                theme === 'dark' 
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <LuMoon className={`w-4 h-4 ${theme === 'dark' ? 'animate-pulse' : ''}`} />
              <span>Gelap</span>
            </button>

            {/* Opsi 3: System */}
            <button
              onClick={() => setTheme('system')}
              className={`relative cursor-pointer z-10 w-[32%] py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors ${
                theme === 'system' 
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <LuMonitor className="w-4 h-4" />
              <span>Sistem</span>
            </button>

          </div>
        </div>
      </div>

      {/* MODAL UNTUK TAMBAH RANGE */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-lg dark:text-white">Tambah Rentang Biaya</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X size={20} className="text-zinc-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Min</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={newRange.min}
                    onChange={(e) => setNewRange({...newRange, min: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Max (Kosong = ∞)</label>
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={newRange.max}
                    onChange={(e) => setNewRange({...newRange, max: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Biaya Admin</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">Rp</span>
                  <input 
                    type="number" 
                    placeholder="2500"
                    value={newRange.fee}
                    onChange={(e) => setNewRange({...newRange, fee: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={addRange}
                disabled={!newRange.min || !newRange.fee}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSettingsClient;