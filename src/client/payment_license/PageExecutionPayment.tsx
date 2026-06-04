'use client';
import { DEFAULT_NAME_APP } from "@/lib/constanta";
import { formatIDR, copyToClipboard } from "@/lib/Helpers";
import { LuArrowLeft as ArrowLeft, LuClock as Clock, LuCopy as Copy, LuQrCode as QrCode, LuCheck as Check, LuInfo as Info, LuCircleCheck as CheckCircle, LuBan as XCircle } from "react-icons/lu";
import { LicenseTRX } from "@prisma/client";
import Link from "next/link";
import RenderLogoBrandTransaction, { PaymentInstructions } from "@/components/RenderLogoBrandTransaction";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelMyTransaction } from "@/models/LicenseTransaction";
import Toast from "@/components/Toast";

export default function PageExecutionPayment({
  transaction
}: {
  transaction: LicenseTRX;
}) {
  const router = useRouter();
  const calculateSecondsLeft = () => {
    const expiryTime = new Date(transaction.expiredDate).getTime();
    const now = new Date().getTime();
    const differenceInSeconds = Math.floor((expiryTime - now) / 1000);
    
    // Jika waktu sudah lewat, kembalikan angka 0
    return differenceInSeconds > 0 ? differenceInSeconds : 0;
  };
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "EXPIRED";
    
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCountdown(calculateSecondsLeft());
    setMounted(true);
  }, []);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  const handleCancel = async () => {
    if (!confirm("Yakin ingin membatalkan transaksi ini?")) return;
    setCancelling(true);
    try {
      const res = await cancelMyTransaction();
      if (res.success) {
        router.push("/license");
      } else {
        setToast({ type: 'error', title: 'Gagal', message: res.error || "Gagal membatalkan" });
      }
    } catch {
      setToast({ type: 'error', title: 'Error', message: "Terjadi kesalahan" });
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!mounted || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/license/payment/status/' + transaction.id)
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown, mounted]);

  

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <Link href={"/"} className="flex cursor-pointer items-center space-x-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali Ke Home</span>
      </Link>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg animate-pulse"><Clock className="w-4 h-4" /></div>
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">BATAS WAKTU PEMBAYARAN</h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-500">Selesaikan sebelum waktu habis</p>
            </div>
          </div>
          <div suppressHydrationWarning className="text-lg font-mono font-black text-amber-600 dark:text-amber-400">{mounted ? formatTime(countdown) : "--:--:--"}</div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">ID Transaksi</span>
              <h3 className="text-lg font-bold font-mono text-zinc-800 dark:text-white">{transaction.id}</h3>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Metode Pembayaran</span>
              <div className="flex items-center sm:justify-end space-x-2 mt-0.5">
                <span className="text-sm font-semibold">{transaction.paymentMethod.toUpperCase()}</span>
                {RenderLogoBrandTransaction(transaction.paymentMethod)}
              </div>
            </div>
          </div>

          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-center space-y-1 border border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">JUMLAH TAGIHAN</span>
            <div className="flex items-center justify-center space-x-2 cursor-pointer" onClick={() => copyToClipboard(transaction.total.toString(), setCopied)}>
              <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {formatIDR(transaction.total)}
              </h2>
              <button  
                className={`p-1 cursor-pointer transition ${copied ? "text-emerald-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-white"}`}
                title={copied ? "Berhasil disalin!" : "Salin nominal"}
              >
                {/* Kunci Perubahan: Kondisional Ikon berdasarkan state copied */}
                {copied ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {transaction.paymentMethod == "qris" ? (
            <div className="flex flex-col items-center space-y-6">
              <h4 className="font-bold">Scan Kode QRIS di Bawah Ini</h4>
              <div className="relative p-4 bg-white rounded-2xl border shadow-lg">
                <img className="w-full max-w-80" src={transaction.paymentCode as string} alt="QRIS KODE"/>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-indigo-50/30 dark:bg-zinc-800 border rounded-2xl gap-4">
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase">NOMOR REKENING VA</span>
                  <div className="text-2xl font-mono font-bold tracking-wider">{transaction.paymentCode}</div>
                </div>
                <button onClick={() => copyToClipboard(transaction.paymentCode as string, setCopied)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm cursor-pointer flex items-center space-x-2">
                  {copied ? <><Check className="w-4 h-4" /><span>Disalin!</span></> : <><Copy className="w-4 h-4" /><span>Salin Nomor VA</span></>}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl"><span className="text-zinc-400">Nama Rekening VA</span><p className="font-semibold">{DEFAULT_NAME_APP} / GOLD</p></div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl"><span className="text-zinc-400">Nama Merchant</span><p className="font-semibold">{DEFAULT_NAME_APP}</p></div>
              </div>
            </div>
          )}

          <div className="border-t pt-6 space-y-3">
            <h4 className="font-bold text-sm flex items-center space-x-2"><Info className="w-4 h-4 text-indigo-500" /><span>Cara Pembayaran</span></h4>
            <PaymentInstructions 
              methodId={transaction.paymentMethod} 
              paymentCode={transaction.paymentCode as string} 
            />
            <p className="text-xs text-zinc-500">Silakan lakukan transfer sesuai rincian nominal di atas melalui M-Banking atau Dompet Digital pilihan Anda.</p>
          </div>

          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            {cancelling ? "Membatalkan..." : "Batalkan Transaksi"}
          </button>
        </div>
      </div>
      {toast && <Toast toast={toast} setToast={setToast} />}
    </div>
  );
}