'use client'
import LoadingScreenSkeleton from '@/components/Loading';
import { signInWithGoogle } from '@/lib/action';
import { FAQS, ID_LICENSE_FREE } from '@/lib/constanta';
import { FeaturesPlan, PricingPlan, ToastState } from '@/lib/types';
import { getAllLicenses } from '@/models/License';
import { License } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import {
  LuCheck, 
  LuChevronRight, 
  LuInfo, 
  LuCircleHelp 
} from "react-icons/lu";

export default function App() {
  const session = useSession();

  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [license, setLicense] = useState<string | null>(null);
  const [loadingSelectPlane, setLoadingSelectPlane] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [listLicense, setListLicense] = useState<License[]>([]);

  const fetchLicense = async () => {
    setLoading(true);
    try {
      const licenses = await getAllLicenses();
      setListLicense(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.status == "authenticated") {
      setLicense(session.data?.user?.licenseId ?? null);
    } else {
      setLicense(null)
    }

    fetchLicense();
  }, [session.status]);

  const handleSelectPlan = async (plan: License): Promise<void> => {
    // 1. Authentication Validation
    if(plan.id == ID_LICENSE_FREE && session.status != "authenticated") {
      await handleGoogleLogin();
      return;
    }

    if (session.status != "authenticated") {
      await handleGoogleLogin();
      return;
    }
    
    // 2. Prevent selecting already active license
    if (plan.id == license) {
      setToast({
        type: 'info',
        title: 'Paket Sedang Aktif',
        message: `Akun Anda saat ini sudah menggunakan paket ${plan.name}.`
      });
      return;
    }

    // 3. Inform about free tier default status
    if (plan.id == ID_LICENSE_FREE) {
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

  const handleGoogleLogin = async () => {
    setLoadingSelectPlane(true);
    if(session.status == "authenticated") {
      setToast({ type: 'info', title: 'Info', message: 'Anda sudah masuk dengan Google' });
      setLoadingSelectPlane(false);
      return;
    }

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', title: 'Error', message: 'Gagal masuk dengan Google' });
    } finally {
      setLoadingSelectPlane(false);
    }
  };

  if(loading) return <LoadingScreenSkeleton/>
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
                    {session.data.user.license.name || "Free Tier Account"} ({session.data?.user?.name || "User"})
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
            {listLicense.map((plan) => {
              const isActive = plan.id == license;
              const price = isAnnual ? plan.priceYearly : plan.priceMonthly;
              const priceLabel = isAnnual ? '/tahun' : '/bulan';

              return (
                <div 
                  key={plan.id}
                  className={`relative flex flex-col justify-between border rounded-3xl p-6 transition-all duration-300 hover:shadow-xl dark:hover:shadow-black/20 hover:-translate-y-1 ${plan.colorTheme}`}
                >
                  {/* Badge Terlaris */}
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                      POPULER
                    </span>
                  )}

                  {/* Bagian Atas Card */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl shrink-0">
                        <span 
                            dangerouslySetInnerHTML={{ __html: plan.icon }} 
                            className="block w-6 h-6 text-slate-500 dark:text-zinc-400 [&>svg]:w-full [&>svg]:h-full"
                          />
                      </div>
                      {isActive && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          Sedang Aktif
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg md:text-xl font-extrabold tracking-tight">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-1 min-h-[32px] leading-snug font-medium">
                        {plan.description}
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
                          Hemat Rp {((plan.priceMonthly * 12) - plan.priceYearly).toLocaleString('id-ID')} / thn
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5">
                      <FeaturesList features={plan.features as unknown as FeaturesPlan} />
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
                      disabled={loadingSelectPlane || isActive}
                      className={`w-full cursor-pointer py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonTheme}`}
                    >
                      {loadingSelectPlane ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : isActive ? (
                        <span>PAKET AKTIF SAAT INI</span>
                      ) : plan.id == ID_LICENSE_FREE ? (
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

        {/* FAQ ACCORDION SECTION */}
        <div className="max-w-4xl mx-auto px-4 mt-16 space-y-6">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-[11px] md:text-xs text-slate-400 dark:text-zinc-500 mt-1">Jawaban cepat atas pertanyaan seputar aktivasi & langganan StrukApp.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
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

export function FeaturesList({ features }: { features: FeaturesPlan }) {

  // Fungsi untuk memformat Key dan Value sesuai request kamu
  const formatFeature = (key: string, value: string) => {
    // 1. Hilangkan underscore, jadikan spasi, dan buat Kapital di setiap awal kata (Title Case)
    const formattedLabel = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // 2. Kondisi untuk value: jika 'unlimited' jangan tambah + 500
    const formattedValue = value.toLowerCase() === "unlimited" 
      ? "Unlimited" 
      : `${value}`;

    return `${formattedLabel} ${formattedValue}`;
  };

  return (
    <div className="space-y-2">
      {Object.entries(features).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <LuCheck className="w-3 h-3 text-blue-500" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
            {formatFeature(key, value)}
          </span>
        </div>
      ))}
    </div>
  );
}