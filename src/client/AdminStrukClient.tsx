'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllReceiptsAdmin } from '@/models/Receipt';
import { LuHistory, LuSearch, LuChevronLeft, LuChevronRight, LuEye, LuEyeOff } from 'react-icons/lu';
import { formatIDR } from '@/lib/Helpers';
import Toast from '@/components/Toast';
import { TableSpinnerLoader } from '@/components/Loading';

type ToastState = { type: 'success' | 'error' | 'info'; title: string; message: string } | null;
type Receipt = { id: string; nama: string; userId: string; type: string; total: number | null; createdAt: Date; user: { id: string; name: string | null; email: string | null } | null };

export default function AdminStrukClient() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showUserIds, setShowUserIds] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const perPage = 15;

  const fetchData = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await getAllReceiptsAdmin({ search: searchTerm || undefined, limit: 100 });
      setReceipts(data as any);
    } catch (err: any) { setToast({ type: 'error', title: 'Error', message: err.message });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search ? receipts.filter((r) => r.nama.toLowerCase().includes(search.toLowerCase()) || r.user?.name?.toLowerCase().includes(search.toLowerCase()) || r.user?.email?.toLowerCase().includes(search.toLowerCase())) : receipts;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
      {toast && <Toast toast={toast} setToast={setToast} />}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm">Semua Riwayat Struk</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Cari nama/user..." className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs w-48" />
          </div>
          <button onClick={() => setShowUserIds(!showUserIds)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" title={showUserIds ? 'Sembunyikan ID User' : 'Tampilkan ID User'}>
            {showUserIds ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {paged.length > 0 && <p className="text-[10px] text-slate-400 mb-3">Menampilkan {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} dari {filtered.length} struk</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-700/50">
              <Th>Nama</Th><Th>User</Th>{showUserIds && <Th>ID User</Th>}<Th>Tipe</Th><Th>Total</Th><Th>Tanggal</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSpinnerLoader colSpan={showUserIds ? 6 : 5} />
            : paged.length === 0 ? (
              <tr><td colSpan={showUserIds ? 6 : 5} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2"><LuHistory className="w-8 h-8 text-slate-300 dark:text-zinc-600" /><p className="text-xs text-slate-400">Belum ada data struk</p></div>
              </td></tr>
            ) : paged.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 px-2 font-medium max-w-[140px] truncate">{r.nama}</td>
                <td className="py-3 px-2 text-slate-500 max-w-[120px] truncate">{r.user?.name || r.user?.email || '-'}</td>
                {showUserIds && <td className="py-3 px-2 text-[10px] font-mono text-slate-400 max-w-[100px] truncate">{r.userId}</td>}
                <td className="py-3 px-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.type === 'RECEIPT_UPLOAD' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>{r.type === 'RECEIPT_UPLOAD' ? 'Upload' : 'Manual'}</span>
                </td>
                <td className="py-3 px-2 font-bold">{r.total ? formatIDR(r.total) : '-'}</td>
                <td className="py-3 px-2 text-slate-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > perPage && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30"><LuChevronLeft className="w-4 h-4" /></button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${i === page ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30"><LuChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2.5 px-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-left">{children}</th>;
}
