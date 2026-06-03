import LoadingScreenSkeleton from '@/components/Loading'
import { auth } from '@/lib/auth';
import { DEFAULT_NAME_APP } from '@/lib/constanta';
import { formatIDR } from '@/lib/Helpers';
import { getTransactionNoPendingByUserId } from '@/models/LicenseTransaction';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import { FiCheck, FiChevronRight } from 'react-icons/fi';

const page = async () => {
    const session = await auth();
    if(!session) redirect("/");
    const transaction = await getTransactionNoPendingByUserId(session.user.id);
    if(!transaction) return notFound();

    return (
        <Suspense fallback={<LoadingScreenSkeleton/>}>
            <div className="max-w-2xl mx-auto space-y-8 animate-scaleIn">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center p-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400 mb-2">
                    <FiCheck className="w-12 h-12 stroke-[3]" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Pembayaran Sukses!</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                        Lisensi Anda telah aktif secara otomatis. Kami telah memperbarui akun Anda ke tingkat level tertinggi.
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-5">
                        <div>
                        <h3 className="font-black text-lg tracking-tight">KUITANSI DIGITAL</h3>
                        <p className="text-[11px] text-zinc-400">{DEFAULT_NAME_APP} Payment Gateway</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">LUNAS / PAID</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div><span className="text-zinc-400 text-[11px] block">DITERBITKAN UNTUK</span><strong className="text-zinc-700 dark:text-zinc-200">{transaction.user.name}</strong></div>
                        <div className="text-right"><span className="text-zinc-400 text-[11px] block">TANGGAL</span><strong className="text-zinc-700 dark:text-zinc-200">{new Date().toLocaleDateString("id-ID")}</strong></div>
                        <div><span className="text-zinc-400 text-[11px] block">ID TRANSAKSI</span><strong className="text-zinc-700 dark:text-zinc-200 font-mono">{transaction.id}</strong></div>
                        <div className="text-right"><span className="text-zinc-400 text-[11px] block">METODE</span><strong className="text-zinc-700 dark:text-zinc-200">{transaction.paymentMethod.toUpperCase()}</strong></div>
                    </div>

                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>

                    <div className="space-y-4">
                        <span className="text-[11px] text-zinc-400 font-bold block">RINCIAN LISENSI</span>
                        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border">
                        <div>
                            <strong className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{transaction.license.name}</strong>
                            <p className="text-xs text-zinc-400">Aktif Selama {transaction.billingCycle == "monthly" ? "1 Bulan" : "1 Tahun"}</p>
                        </div>
                        <span className="text-sm font-bold">{formatIDR(transaction.total)}</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 text-sm border-t pt-5">
                        <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>{formatIDR(transaction.total)}</span></div>
                        <div className="flex justify-between text-zinc-500"><span>Biaya Layanan</span><span>{transaction.total === 0 ? "Gratis" : formatIDR(transaction.total)}</span></div>
                        <div className="flex justify-between text-zinc-500"><span>PPN (11%)</span><span>{formatIDR(transaction.total)}</span></div>
                        <div className="flex justify-between items-baseline pt-2 border-t">
                        <strong className="text-base font-bold">Total Dibayar</strong>
                        <strong className="text-xl font-black text-indigo-600">Rp {formatIDR(transaction.total)}</strong>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex cursor-pointer items-center space-x-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    <span>Bagian Beranda Utama</span><FiChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </Suspense>
    )
}

export default page


