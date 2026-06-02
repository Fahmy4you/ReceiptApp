'use client'
import { LIST_LICENSE, STATUS_LISENSI_LABELS } from '@/lib/constanta';
import { PricingPlan, ToastState } from '@/lib/types';
import { StatusLisensi } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import {
  LuCheck, 
  LuLock, 
  LuChevronRight, 
  LuInfo, 
  LuCircleHelp 
} from "react-icons/lu";

export default function App() {
  // SIMULATED TESTING STATES (Allows testing interactive flows without real Next.js / NextAuth backend dependencies)
  const session = useSession();

  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [license, setLicense] = useState<StatusLisensi | null>(null);
  const [loadingSelectPlane, setLoadingSelectPlane] = useState<boolean>(false);

  useEffect(() => {
    if (session.status == "authenticated") {
      setLicense(session.data?.user?.license ?? null);
    } else {
      setLicense(null)
    }
  }, [session.status]);

  const handleSelectPlan = async (plan: PricingPlan): Promise<void> => {
    // 1. Authentication Validation
    if (session.status !== "authenticated") {
      setToast({
        type: 'error',
        title: 'Gagal',
        message: 'Silakan masuk menggunakan Google terlebih dahulu untuk membeli paket.'
      });
      return;
    }
    
    // 2. Prevent selecting already active license
    if (plan.id == license) {
      setToast({
        type: 'info',
        title: 'Paket Sedang Aktif',
        message: `Akun Anda saat ini sudah menggunakan paket ${STATUS_LISENSI_LABELS[plan.id]}.`
      });
      return;
    }

    // 3. Inform about free tier default status
    if (plan.id === 'FREE_TIER') {
      setToast({
        type: 'info',
        title: 'Informasi',
        message: 'Paket Free Tier adalah paket bawaan dasar Anda.'
      });
      return;
    }

    try {
      setLoadingSelectPlane(true);

    } catch (error) {
      console.error(error);
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan sistem saat menghubungi server.'
      });
    } finally {
      setLoadingSelectPlane(false);
    }
  };

  const faqs = [
    {
      q: "Bagaimana cara kerja reset token harian?",
      a: "Setiap hari pada pukul 00:00 WIB, token OCR Anda akan otomatis di-reset ulang kembali ke jatah paket Anda (misal 30 token untuk Silver). Sisa token hari sebelumnya tidak diakumulasikan ke hari berikutnya."
    },
    {
      q: "Dapatkah saya melakukan upgrade ke paket yang lebih tinggi kapan saja?",
      a: "Tentu saja! Anda bisa menaikkan tier akun Anda kapan saja dengan menghubungi admin. Sisa hari masa aktif paket lama Anda akan dihitung secara proporsional untuk memotong biaya upgrade paket baru."
    },
    {
      q: "Apa yang terjadi jika jumlah layout saya melebihi batas jatah saat downgrade?",
      a: "Jika masa langganan premium Anda berakhir dan akun Anda kembali ke Free Tier, layout kustom Anda yang sudah ada tetap tersimpan dengan aman, namun Anda tidak dapat mengedit atau membuat layout baru sampai jatah layout Anda di bawah batas maksimal (3 layout)."
    },
    {
      q: "Metode pembayaran apa saja yang didukung oleh admin?",
      a: "Kami mendukung berbagai metode pembayaran instan dan aman, seperti QRIS, Transfer Bank (BCA, Mandiri, BNI, BRI), serta dompet digital (GOPAY, OVO, Dana, ShopeePay)."
    }
  ];

  return (
    <div>
      <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-800 dark:text-zinc-100 transition-colors duration-300 pb-16 font-sans">

        {/* HEADER AREA */}
        <div className="px-4 pb-6">

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              Premium Licensing
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Pilih Lisensi Terbaik Bisnis Anda
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Dapatkan token AI OCR harian yang melimpah dan buat layout struk kustom tanpa batas untuk operasional kasir harian yang super lancar dan profesional.
            </p>

            {/* TOGGLE SWITCH BULANAN / TAHUNAN */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs md:text-sm font-bold transition-colors ${!isAnnual ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                Bayar Bulanan
              </span>
              
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-8 bg-slate-200 dark:bg-zinc-800 rounded-full p-1 transition-colors focus:outline-none relative shadow-inner cursor-pointer"
              >
                <div 
                  className={`w-6 h-6 bg-blue-600 rounded-full transition-all shadow-md transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>

              <span className={`text-xs md:text-sm font-bold transition-colors flex items-center gap-1.5 ${isAnnual ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                Bayar Tahunan
                <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Hemat 20%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* LISENSI AKTIF NOTIFICATION BAR */}
        {session.status === "authenticated" && (
          <div className="max-w-7xl mx-auto px-4 mb-8">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <LuInfo />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider leading-none">Lisensi Anda Saat Ini</p>
                  <h5 className="font-extrabold text-xs md:text-sm text-slate-800 dark:text-zinc-100 truncate mt-1">
                    {license && STATUS_LISENSI_LABELS[license] ? STATUS_LISENSI_LABELS[license] : "Free Tier Account"} ({session.data?.user?.name || "User"})
                  </h5>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto text-xs font-bold border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-zinc-800">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Sisa Kuota OCR</p>
                  <p className="text-slate-800 dark:text-zinc-100 text-xs md:text-sm font-black">{session.data?.user?.kuota ?? 0} Scan OCR</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl uppercase tracking-widest text-[9px] font-black shrink-0">
                  AKTIF
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GRID DAFTAR KARTU PRICING */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {LIST_LICENSE.map((plan) => {
              const isActive = plan.id === license;
              const price = isAnnual ? plan.priceAnnually : plan.priceMonthly;
              const priceLabel = isAnnual ? '/tahun' : '/bulan';

              return (
                <div 
                  key={plan.id}
                  className={`relative flex flex-col justify-between border rounded-3xl p-6 transition-all duration-300 hover:shadow-xl dark:hover:shadow-black/20 hover:-translate-y-1 ${plan.colorTheme}`}
                >
                  {/* Badge Terlaris */}
                  {plan.badgeText && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                      {plan.badgeText}
                    </span>
                  )}

                  {/* Bagian Atas Card */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl shrink-0">
                        <plan.icon/>
                      </div>
                      {isActive && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          Sedang Aktif
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg md:text-xl font-extrabold tracking-tight">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-1 min-h-[32px] leading-snug font-medium">
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Blok Harga */}
                    <div className="pt-2">
                      {plan.priceMonthly === 0 ? (
                        <h4 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Gratis</h4>
                      ) : (
                        <div className="flex items-baseline">
                          <span className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">
                            Rp {price.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold ml-1">
                            {priceLabel}
                          </span>
                        </div>
                      )}
                      {isAnnual && plan.priceMonthly > 0 && (
                        <p className="text-[9px] text-emerald-500 font-bold mt-1 uppercase">
                          Hemat Rp {((plan.priceMonthly * 12) - plan.priceAnnually).toLocaleString('id-ID')} / thn
                        </p>
                      )}
                    </div>

                    {/* Fitur Utama Highlight */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <LuCheck className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-200">{plan.tokens}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <LuCheck className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-200">{plan.layouts}</span>
                      </div>
                    </div>

                    {/* Fitur Standar */}
                    {/* <div className="pt-3 space-y-2.5">
                      <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider">Fitur Paket:</p>
                      {plan.features.slice(2).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <SvgCheck />
                          <span className="text-xs text-slate-500 dark:text-zinc-400 leading-normal font-medium">{feat}</span>
                        </div>
                      ))}
                    </div> */}
                  </div>

                  {/* Tombol Berlangganan */}
                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800/80">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={loadingSelectPlane || isActive || plan.id == 'FREE_TIER'}
                      className={`w-full cursor-pointer py-3 px-4 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonTheme}`}
                    >
                      {loadingSelectPlane ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : isActive ? (
                        <span>PAKET AKTIF SAAT INI</span>
                      ) : plan.id === 'FREE_TIER' ? (
                        <span>GUNAKAN GRATIS</span>
                      ) : (
                        <>
                          <span>BERLANGGANAN</span>
                          <LuChevronRight />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAIL PERBANDINGAN FITUR (DESKTOP ONLY) */}
        <div className="max-w-7xl mx-auto px-4 mt-16 hidden lg:block">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white mb-6">Tabel Lengkap Perbandingan Fitur</h4>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800/80 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  <th className="pb-4 font-black">Fitur Utama</th>
                  <th className="pb-4 font-black text-center text-slate-700 dark:text-zinc-300">Free Tier</th>
                  <th className="pb-4 font-black text-center text-blue-500">Silver</th>
                  <th className="pb-4 font-black text-center text-amber-500">Golden</th>
                  <th className="pb-4 font-black text-center text-purple-500">Platinum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 font-bold text-slate-600 dark:text-zinc-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="py-4 font-medium text-slate-700 dark:text-zinc-200">Jatah Scan OCR AI Harian</td>
                  <td className="py-4 text-center">1 Token / hari</td>
                  <td className="py-4 text-center">30 Token / hari</td>
                  <td className="py-4 text-center">100 Token / hari</td>
                  <td className="py-4 text-center text-purple-500 font-black">Unlimited</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="py-4 font-medium text-slate-700 dark:text-zinc-200">Batas Penyimpanan Desain Layout</td>
                  <td className="py-4 text-center">Maksimal 3</td>
                  <td className="py-4 text-center">Maksimal 5</td>
                  <td className="py-4 text-center">Maksimal 10</td>
                  <td className="py-4 text-center">Maksimal 20</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className="max-w-4xl mx-auto px-4 mt-16 space-y-6">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-[11px] md:text-xs text-slate-400 dark:text-zinc-500 mt-1">Jawaban cepat atas pertanyaan seputar aktivasi & langganan StrukApp.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-slate-800 dark:text-zinc-100 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <LuCircleHelp className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}