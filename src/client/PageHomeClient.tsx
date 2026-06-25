'use client';

import React, { useState, useEffect, useRef } from 'react';
// Menggunakan react-icons (Fi untuk Feather, Fa6 untuk Font Awesome modern)
import { 
  FiFileText, 
  FiTrendingUp, 
  FiCpu, 
  FiPlus,
  FiCheck,
  FiCopy,
  FiHelpCircle,
  FiUploadCloud,
  FiCamera,
  FiLayers,
  FiUsers,
  FiUser,
  FiLayout,
  FiLogOut,
  FiChevronDown
} from 'react-icons/fi';
import { 
  FaArrowUpRightFromSquare,
  FaGoogle
} from 'react-icons/fa6';
import { getUserById } from '@/models/User';
import { getUserDashboardStats } from '@/models/UserStatistic';
import LoadingScreenSkeleton from '@/components/Loading';
import { DefaultConfigLayout, DefaultEwalletLayout, exampleHistoryData, labelWaktu } from '@/lib/constanta';
import TrendChart from '@/components/TrendChart';
import { getAllReceipts } from '@/models/Receipt';
import { copyToClipboard, formatIDR } from '@/lib/Helpers';
import Link from 'next/link';
import Toast from '@/components/Toast';
import { signOut, useSession } from 'next-auth/react';
import { LuLoader, LuUserPen } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { ReceiptWithLayout, SettingsData } from '@/lib/types';
import PreviewPage from '@/components/PreviewPage';

export default function PageHomeClient({settingData}: {settingData: SettingsData}) {
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>({
    totalLayout: 0,
    totalPdf: 0,
    totalGambar: 0,
    totalPrint: 0,
    totalSemua: 0,
    totalUser: 0,
    percentPdf: 0,
    percentGambar: 0,
    percentPrint: 0,
    percentUser: 0,
    chartData: [],
    filterAman: 'semua' // Untuk mendeteksi filter aktif di UI
  });
  const [receiptsData, setReceiptsData] = useState<Awaited<ReturnType<typeof getAllReceipts>>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [strukData, setStrukData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const session = useSession();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    if(session.status == "authenticated") return;
    setLoadingGoogle(true);
    try {
      const res = await fetch("/api/auth/csrf");
      const { csrfToken } = await res.json();
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/signin/google";
      form.innerHTML = `
        <input name="csrfToken" value="${csrfToken}" />
        <input name="callbackUrl" value="/" />
      `;
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      setLoadingGoogle(false);
    }
  };

  const handleLogoutConfirmation = async () => {
    const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
    if (konfirmasi) {
      setLoading(true);

      try {
        await signOut({ callbackUrl: "/" });
      } catch (error) {
        console.error(error)
        setToast({ type: 'error', title: 'Error', message: 'Gagal keluar dari akun' });
      } finally {{
        setLoading(false);
        router.push("/");
      }}
    }
  };

  const fetchStatistik = async () => {
    try {
      setLoading(true);
      const statistik = await getUserDashboardStats({filter: "hari"});
      setStats(statistik)
    } catch(err) {
      setToast({ type: 'error', title: 'Error', message: "Gagal mendapatkan statistik " + err });
    } finally {
      setLoading(false)
    }
  }

  const getReceiptsData = async () => {
    try {
      setLoading(true);
      if(session.status == "authenticated") {
        const receiptTerbaru = await getAllReceipts({ 
          limit: 3 
        });
        setReceiptsData(receiptTerbaru)
      } else {
        setReceiptsData(exampleHistoryData as any)
      }
    } catch(err) {
      setToast({ type: 'error', title: 'Error', message: "Gagal mendapatkan statistik " + err });
    } finally {
      setLoading(false)
    }
  }

  const previewData = (item: ReceiptWithLayout) => {
    setStrukData(item.content);
      if (item.layout && item.layout.config) {
        setConfig(item.layout.config);
      } else {
        if(item.layoutId == "DEFAULT_EWALLET_LAYOUT") {
          setConfig(DefaultEwalletLayout);
        } else {
          setConfig(DefaultConfigLayout);
        }
      }
  
      setShowModal(true);
  }

  useEffect(() => {
    fetchStatistik();
    getReceiptsData();
  }, [session.status])

  const currentLabel = labelWaktu[stats.filterAman as keyof typeof labelWaktu] || "vs tahun lalu";
  if(loading) return <LoadingScreenSkeleton/>
  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-blue-950/20 text-white transition-colors duration-300 border border-blue-500/30">
          <div className="absolute right-0 bottom-0 top-0 opacity-[0.08] pointer-events-none flex items-center text-white">
            <FiTrendingUp className="w-72 h-72 transform translate-x-10 translate-y-10" />
          </div>

          <div className="relative z-10 w-full flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Didukung OCR Menggunakan AI
                </span>
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
                  ReceiptApp <span className="text-white/40 font-normal">—</span> Buat Struk Digital Lebih Cepat
                </h3>
              </div>
              
              <div className="flex gap-2 flex-col lg:flex-row">
                {session.status == "authenticated" ? (
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)} 
                      title={session.data?.user?.name || "User"}
                      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 w-full md:w-auto self-start md:self-auto text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 shadow-sm"
                    >
                      <FiUser className="w-4 h-4 text-white/80" /> 
                      {session.data?.user?.name && session.data.user.name.length > 10 
                        ? `${session.data.user.name.slice(0, 10)}...` 
                        : session.data?.user?.name
                      }
                      <FiChevronDown className={`w-3 h-3 text-white/60 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-xl py-1.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-150">
                        
                        {session.data?.user.role?.role === "admin" && (
                          <Link 
                            href="/admin"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <FiLayout className="w-4 h-4 text-slate-400" />
                            <span>Dashboard</span>
                          </Link>
                        )}
                        <Link 
                          href="/settings"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <LuUserPen  className="w-4 h-4 text-slate-400" />
                          <span>Profil</span>
                        </Link>

                        <div className="border-t border-slate-100 dark:border-zinc-800/60 my-1"></div>

                        <button 
                          onClick={handleLogoutConfirmation}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>

                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loadingGoogle}
                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 w-full md:w-auto self-start md:self-auto text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 shadow-sm"
                  >
                    {loadingGoogle ? (
                      <>
                        <LuLoader className="w-4 h-4 text-white/80 animate-spin" />
                        <span>Menghubungkan...</span>
                      </>
                    ) : (
                      <>
                        <FaGoogle className="w-4 h-4 text-white/80" /> 
                        <span>Login Google</span>
                      </>
                    )}
                  </button>
                )}
                <Link 
                  href="/panduan"
                  rel="noopener noreferrer" 
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 w-full md:w-auto self-start md:self-auto text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 shadow-sm">
                  <FiHelpCircle className="w-4 h-4 text-white/80" /> Cara Pemakaian
                </Link>
              </div>
            </div>

            {toast && (
                <div>
                    <Toast toast={toast} setToast={setToast} />
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
              
              {/* Box 1: Status Lisensi */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex flex-col justify-center">
                <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">Status Lisensi</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  <p className="font-bold text-sm text-white">{session.data?.user.license?.name || "No License"}</p>
                </div>
              </div>

              {/* Box 2: ID Perangkat (Fixed Overflow) */}
              {/* Perbaikan: Tambah min-w-0 agar box ini bisa menyusut dengan fleksibel */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex flex-col justify-center min-w-0">
                <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider mb-1.5">ID REFERRAL</span>
                {/* Perbaikan: Tambah w-full dan overflow-hidden */}
                <div 
                  onClick={() => copyToClipboard("Silahkan Login Untuk Mendapat Referral Code", setCopied)}
                  className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-3 py-1.5 cursor-pointer group hover:bg-black/30 transition-colors w-full overflow-hidden gap-2"
                >
                  {/* Perbaikan: Tambah truncate agar text hash yang kepanjangan otomatis terpotong titik-titik (...) */}
                  <code className="font-mono text-xs text-blue-200 font-medium select-all group-hover:text-white transition-colors truncate block">
                    {session.status == "authenticated" ? session.data?.user.id : "Silahkan Login Untuk Mendapat Referral Code"}
                  </code>
                  {/* Perbaikan: shrink-0 biar tombol copy-nya gak ikut gepeng */}
                  <button 
                    type="button"
                    className="text-white/60 cursor-pointer group-hover:text-white transition-colors p-1 shrink-0"
                    title="Salin ID"
                  >
                    {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Box 3: Kuota & Tombol Isi Ulang Bersandingan */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm flex items-center justify-between gap-4">
                <div className="flex flex-col justify-center">
                  <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">Sisa Kuota OCR</span>
                  <p className="font-black text-lg text-white mt-0.5">
                    {session.status === "authenticated" ? (session.data?.user.kuota ?? 0) : 10} <span className="text-xs text-blue-200 font-bold">Scan</span>
                </p>
                </div>
                
                <Link href="/license" 
                  className="bg-white cursor-pointer hover:bg-slate-100 text-blue-600 p-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-black/10 shrink-0"
                  title="Isi Ulang Kuota"
                >
                  <FiPlus className="w-4 h-4 stroke-[3]" />
                  <span>Isi Kuota</span>
                </Link>
              </div>

            </div>

          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm md:text-base">Aktivitas Terakhir</h4>
                <Link href={"/history"} className="text-xs cursor-pointer text-blue-500 font-bold hover:underline">
                  Semua
                </Link>
              </div>

              <div className="space-y-4">
                {receiptsData.length === 0 ? (
                  // Tampilan jika data kosong
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                      Belum Ada Aktifitas
                    </p>
                  </div>
                ) : (
                  // Tampilan jika data ada (maksimal 3)
                  receiptsData.slice(0, 3).map((tx) => {
                    const isUpload = tx.type == "RECEIPT_UPLOAD";
                    
                    // Potong nama jika lebih dari 20 karakter
                    const namaReceipt = tx.nama.length > 20 
                      ? tx.nama.substring(0, 20) + "..." 
                      : tx.nama;

                    // Format tanggal createdAt (Contoh hasil: 29 Mei 2026 atau sesuai locale)
                    const tanggalBuat = new Date(tx.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div key={tx.id} onClick={() => previewData(tx)} className="flex gap-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 px-2 py-1 rounded-lg items-center justify-between py-2">
                        <div className="flex gap-3 min-w-0">
                          {/* Ikon dinamis berdasarkan tipe */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isUpload
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-teal-500/10 text-teal-500"
                            }`}
                          >
                            {isUpload ? (
                              <FiCamera className="w-4 h-4" />
                            ) : (
                              <FiFileText className="w-4 h-4" />
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            {/* Nama receipt maksimal 20 karakter */}
                            <p className="text-xs font-semibold truncate">{namaReceipt}</p>
                            {/* Sub-text menampilkan Tanggal • Tipe */}
                            <p className="text-[10px] text-slate-400 truncate">
                              {tanggalBuat} • {isUpload ? "Upload" : "Manual"}
                            </p>
                          </div>
                        </div>

                        {/* Total Harga */}
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 shrink-0">
                          {formatIDR(tx.total || 0)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Link href={"/history"} 
              className="w-full cursor-pointer mt-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700/80 rounded-xl text-xs font-semibold text-center transition-colors"
            >
              Lihat Seluruh Riwayat
            </Link>
          </div>
      </div>

      {showModal && (
          <PreviewPage
            show={showModal}
            onClose={() => setShowModal(false)}
            formData={strukData} 
            setFormData={setStrukData}
            isGenerating={isGenerating}
            config={config}
            setIsGenerating={setIsGenerating}
            settings={settingData as SettingsData | null}
          />
      )}
    </>
  );
}