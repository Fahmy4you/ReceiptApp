'use client';

import { useState, useEffect } from 'react';
import { updateLicense } from '@/models/License';
import { LuLoader, LuSave } from 'react-icons/lu';
import Toast from '@/components/Toast';

type License = { id: string; name: string; features: any };
type ToastState = { type: 'success' | 'error' | 'info'; title: string; message: string } | null;

export default function AdminKuotaClient({ licenses }: { licenses: License[] }) {
  const freeTier = licenses.find((l) => l.id === 'l-free-tier');
  const [tokenPerDay, setTokenPerDay] = useState('10');
  const [maxLayout, setMaxLayout] = useState('3');
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (freeTier) {
      setTokenPerDay((freeTier.features as any)?.token_perhari_yang_didapat || '10');
      setMaxLayout((freeTier.features as any)?.maksimal_layout || '3');
    }
  }, [freeTier]);

  const handleSave = async () => {
    if (!freeTier) return;
    setSaving(true);
    try {
      const res = await updateLicense(freeTier.id, { features: { token_perhari_yang_didapat: tokenPerDay, maksimal_layout: maxLayout } } as any);
      if (res.success) { setToast({ type: 'success', title: 'Berhasil', message: 'Kuota gratis diperbarui' }); setChanged(false); }
      else { setToast({ type: 'error', title: 'Gagal', message: res.error || "Terjadi kesalahan" }); }
    } catch (err: any) { setToast({ type: 'error', title: 'Error', message: err.message });
    } finally { setSaving(false); }
  };

  if (!freeTier) return <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border"><p className="text-xs text-slate-400">Paket Free Tier tidak ditemukan.</p></div>;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
      {toast && <Toast toast={toast} setToast={setToast} />}
      <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">Ubah batas harian dan layout untuk pengguna Free Tier</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700/50">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Token per Hari</label>
          <input type="number" value={tokenPerDay} onChange={(e) => { setTokenPerDay(e.target.value); setChanged(true); }} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold" />
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700/50">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Maksimal Layout</label>
          <input type="number" value={maxLayout} onChange={(e) => { setMaxLayout(e.target.value); setChanged(true); }} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold" />
        </div>
      </div>
      {changed && (
        <button onClick={handleSave} disabled={saving} className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
          {saving ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuSave className="w-3.5 h-3.5" />} Simpan Perubahan
        </button>
      )}
    </div>
  );
}
