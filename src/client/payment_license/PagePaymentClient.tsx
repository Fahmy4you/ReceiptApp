'use client';

import { useState } from "react";
import { License, LicenseTRX } from "@prisma/client";
import { LICENSE_PAYMENT_BILLING, PAYMENT_METHODS, PPN } from "@/lib/constanta";
import Toast from "@/components/Toast";
import { ToastState } from "@/lib/types";
import { useRouter } from "next/navigation";
import { chargePaymentMidtrans } from "@/lib/midtrans";
import { formatIDR } from "@/lib/Helpers";
import { LuWallet as Wallet, LuBuilding2 as Building, LuChevronRight as ChevronRight, LuSparkles as Sparkles, LuCircleCheck as CheckCircle, LuLoader } from "react-icons/lu";
import RenderLogoBrandTransaction from "@/components/RenderLogoBrandTransaction";

export default function PagePaymentClient({
  licenseData,
  billing,
}: {
  licenseData: License;
  billing: typeof LICENSE_PAYMENT_BILLING[number];
}) {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [countdown, setCountdown] = useState(86400);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const priceLicense = billing == "monthly" ? licenseData.priceMonthly : licenseData.priceYearly;
  const adminFee = selectedMethod.fee;
  const ppn = PPN != null ? Math.round(priceLicense * PPN) : 0;
  const totalAmount = priceLicense + adminFee + ppn;

  const handleSelectMethodProceed = async (methodId: string) => {
    setLoading(true);
    try {
      const method = PAYMENT_METHODS.find((m) => m.id == methodId);
      if (!method) {
        setToast({ type: "error", title: "Error", message: "Metode pembayaran tidak valid." });
        return;
      }
  
      const midtrans = await chargePaymentMidtrans({
        licenseId: licenseData.id,
        total: totalAmount,
        billingCycle: billing,
        paymentMethod: method.id as any,
      });
  
      if (midtrans.success && midtrans.data) {
        router.push('/license/payment/exec/' + midtrans.data.id)
      } else {
        setToast({ type: "error", title: "Error", message: midtrans.error || "Gagal memproses pembayaran coba lagi, atau lapor admin" });
        return;
        
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false);
    }
  }

  

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full">
          Selesaikan Transaksi Anda
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Pembayaran Lisensi</h2>
        <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
          Pilih paket lisensi terbaik dan tentukan gerbang pembayaran yang paling nyaman bagi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Kolom Kanan: Ringkasan & Cekout */}
        <div className="lg:col-span-5 order-1 lg:order-2">
          <div className="sticky top-24 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md">
            <h3 className="text-base font-bold pb-4 border-b border-zinc-100 dark:border-zinc-800">Ringkasan Belanja</h3>
            
            <div className="py-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-white">{licenseData.name}</h4>
                  <p className="text-xs text-zinc-500 capitalize">Siklus {billing == "monthly" ? "Bulanan" : "Tahunan"}</p>
                </div>
                <span className="text-sm font-semibold">{formatIDR(priceLicense)}</span>
              </div>
              {licenseData.branding && (
                <div className="flex items-center space-x-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 px-2.5 py-1.5 rounded-lg text-xs text-indigo-700 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paket <strong>{licenseData.branding.toUpperCase()}</strong></span>
                </div>
              )}
            </div>

            <div className="py-4 border-y border-zinc-100 dark:border-zinc-800 space-y-2.5 text-sm">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Harga Lisensi</span>
                <span>Rp. {formatIDR(priceLicense)}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Biaya Admin ({selectedMethod.name.split(" ")[0]})</span>
                <span>{adminFee == 0 ? "Gratis" : `Rp ${formatIDR(adminFee)}`}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>PPN ({Math.round(PPN * 100)}%)</span>
                <span>Rp {formatIDR(ppn)}</span>
              </div>
            </div>

            <div className="py-5 flex justify-between items-baseline">
              <span className="text-base font-bold">Total Pembayaran</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">Rp {formatIDR(totalAmount)}</span>
            </div>

            <div className="mb-6 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center space-x-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Aktif instan setelah konfirmasi</span></div>
              <div className="flex items-center space-x-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Garansi pengembalian dana 7 hari</span></div>
            </div>

            <button 
              onClick={() => handleSelectMethodProceed(selectedMethod.id)} 
              disabled={loading} // Mengunci klik pas loading berjalan
              className={`w-full py-4 px-6 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg 
                ${loading 
                  ? "bg-indigo-400 cursor-not-allowed opacity-80 shadow-none" 
                  : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer hover:shadow-indigo-600/20"
                }`}
            >
              {loading ? (
                <>
                  {/* Pakai LuLoader + kelas animate-spin bawaan Tailwind */}
                  <LuLoader className="w-5 h-5 animate-spin" />
                  <span>Memproses Tagihan...</span>
                </>
              ) : (
                <>
                  <span>Lanjutkan Pembayaran</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Kolom Kiri: Pilihan Metode Pembayaran */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              <Wallet className="w-4 h-4" />
              <span>INSTANT PAYMENT / E-WALLET / QRIS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.filter(m => m.category === "qris_ewallet").map((method) => {
                const isSelected = selectedMethod.id === method.id;
                return (
                  <div key={method.id} onClick={() => setSelectedMethod(method)} className={`cursor-pointer rounded-xl p-4 border flex items-center justify-between transition-all ${isSelected ? "ring-2 ring-indigo-600 dark:ring-indigo-500 bg-white dark:bg-zinc-900 border-indigo-600 dark:border-indigo-500" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center shrink-0">
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                      </div>
                      <span className="text-sm font-medium">{method.name.split(" ")[0]}</span>
                    </div>
                    {RenderLogoBrandTransaction(method.id)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              <Building className="w-4 h-4" />
              <span>VIRTUAL ACCOUNT (TRANSFER BANK OTOMATIS)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.filter(m => m.category === "va").map((method) => {
                const isSelected = selectedMethod.id === method.id;
                return (
                  <div key={method.id} onClick={() => setSelectedMethod(method)} className={`cursor-pointer rounded-xl p-4 border flex items-center justify-between transition-all ${isSelected ? "ring-2 ring-indigo-600 dark:ring-indigo-500 bg-white dark:bg-zinc-900 border-indigo-600 dark:border-indigo-500" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center shrink-0">
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                      </div>
                      <span className="text-sm font-medium">{method.name}</span>
                    </div>
                    {RenderLogoBrandTransaction(method.id)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}