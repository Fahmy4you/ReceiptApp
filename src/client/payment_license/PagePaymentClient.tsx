'use client';

import { useEffect, useState } from "react";
import { License } from "@prisma/client";
import { LICENSE_PAYMENT_BILLING, PPN } from "@/lib/constanta";
import { createSnapTransaction } from "@/lib/midtrans";
import { formatIDR } from "@/lib/Helpers";
import { LuLoader, LuCircleCheck, LuExternalLink } from "react-icons/lu";
import { useRouter } from "next/navigation";

declare global {
  interface Window { snap: any }
}

export default function PagePaymentClient({
  licenseData,
  billing,
}: {
  licenseData: License;
  billing: typeof LICENSE_PAYMENT_BILLING[number];
}) {
  const [loading, setLoading] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const router = useRouter();

  const priceLicense = billing == "monthly" ? licenseData.priceMonthly : licenseData.priceYearly;
  const ppn = PPN != null ? Math.round(priceLicense * PPN) : 0;
  const totalAmount = priceLicense + ppn;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
    script.onload = () => setSnapLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await createSnapTransaction({
        licenseId: licenseData.id,
        total: totalAmount,
        billingCycle: billing,
      });
      if (res.success && res.token) {
        window.snap.pay(res.token, {
          onSuccess: () => { router.push("/license/payment/exec/" + res.orderId); },
          onPending: () => { router.push("/license/payment/exec/" + res.orderId); },
          onClose: () => { setLoading(false); },
        });
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight">Pembayaran Lisensi</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Klik tombol di bawah untuk membuka popup pembayaran</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-lg">{licenseData.name}</h3>
            <p className="text-xs text-zinc-500 capitalize">Siklus {billing == "monthly" ? "Bulanan" : "Tahunan"}</p>
          </div>
          <span className="font-bold">{formatIDR(priceLicense)}</span>
        </div>

        <div className="py-4 space-y-2 text-sm">
          <div className="flex justify-between text-zinc-500"><span>Harga Lisensi</span><span>{formatIDR(priceLicense)}</span></div>
          <div className="flex justify-between text-zinc-500"><span>PPN ({Math.round(PPN * 100)}%)</span><span>{formatIDR(ppn)}</span></div>
        </div>

        <div className="flex justify-between items-baseline py-4 border-t border-zinc-100">
          <span className="font-bold">Total</span>
          <span className="text-2xl font-black text-indigo-600">{formatIDR(totalAmount)}</span>
        </div>

        <button
          onClick={handlePay}
          disabled={loading || !snapLoaded}
          className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <><LuLoader className="w-5 h-5 animate-spin" /> Memproses...</>
          ) : !snapLoaded ? (
            <><LuLoader className="w-5 h-5 animate-spin" /> Menyiapkan pembayaran...</>
          ) : (
            <><LuExternalLink className="w-5 h-5" /> Buka Popup Pembayaran</>
          )}
        </button>

        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-1.5 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5"><LuCircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Aktif instan setelah konfirmasi</div>
          <div className="flex items-center gap-1.5"><LuCircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Garansi pengembalian dana 7 hari</div>
        </div>
      </div>
    </div>
  );
}
