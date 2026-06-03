'use client';

import { useState } from 'react';
import { updateLicense } from '@/models/License';
import { LuLoader, LuSave } from 'react-icons/lu';
import { formatIDR } from '@/lib/Helpers';
import Toast from '@/components/Toast';

type License = { id: string; name: string; description: string; features: any; colorTheme: string; buttonTheme: string; priceMonthly: number; priceYearly: number; discount: number | null; levelLicense: number; icon: string };
type ToastState = { type: 'success' | 'error' | 'info'; title: string; message: string } | null;

export default function AdminHargaClient({ licenses }: { licenses: License[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const handleSave = async (license: License) => {
    setSaving(true);
    try {
      const res = await updateLicense(license.id, {
        name: license.name, description: license.description, features: license.features,
        colorTheme: license.colorTheme, buttonTheme: license.buttonTheme,
        priceMonthly: license.priceMonthly, priceYearly: license.priceYearly,
        discount: license.discount, icon: license.icon,
      });
      if (res.success) { setToast({ type: 'success', title: 'Berhasil', message: 'Paket harga diperbarui' }); setEditingId(null); }
      else { setToast({ type: 'error', title: 'Gagal', message: res.error || 'Terjadi kesalahan' }); }
    } catch (err: any) { setToast({ type: 'error', title: 'Error', message: err.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
      {toast && <Toast toast={toast} setToast={setToast} />}
      <div className="space-y-3">
        {licenses.map((lic) => (
          <LicenseCard key={lic.id} license={lic} isEditing={editingId === lic.id}
            onEdit={() => setEditingId(lic.id)} onCancel={() => setEditingId(null)}
            onSave={(u) => handleSave(u)} saving={saving && editingId === lic.id} />
        ))}
      </div>
    </div>
  );
}

function LicenseCard({ license, isEditing, onEdit, onCancel, onSave, saving }: {
  license: License; isEditing: boolean; onEdit: () => void; onCancel: () => void; onSave: (l: License) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...license });

  if (!isEditing) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700/50 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg" dangerouslySetInnerHTML={{ __html: license.icon }} />
            <h3 className="font-bold text-sm">{license.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">Level {license.levelLicense}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">{license.description}</p>
          <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-zinc-400">
            <span>Bulanan: <strong className="text-slate-800 dark:text-zinc-100">{license.priceMonthly === 0 ? 'Gratis' : formatIDR(license.priceMonthly)}</strong></span>
            <span>Tahunan: <strong className="text-slate-800 dark:text-zinc-100">{license.priceYearly === 0 ? 'Gratis' : formatIDR(license.priceYearly)}</strong></span>
          </div>
        </div>
        <button onClick={onEdit} className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors cursor-pointer">Edit</button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nama Paket"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
        <Field label="Deskripsi"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
        <Field label="Harga Bulanan (Rp)"><input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
        <Field label="Harga Tahunan (Rp)"><input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
        <Field label="Diskon (%)"><input type="number" value={form.discount ?? 0} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
        <Field label="Icon (SVG)"><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium font-mono" /></Field>
        <Field label="Token per Hari"><input value={(form.features as any)?.token_perhari_yang_didapat || ''} onChange={(e) => setForm({ ...form, features: { ...form.features, token_perhari_yang_didapat: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
        <Field label="Maksimal Layout"><input value={(form.features as any)?.maksimal_layout || ''} onChange={(e) => setForm({ ...form, features: { ...form.features, maksimal_layout: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" /></Field>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50">Batal</button>
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
          {saving ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuSave className="w-3.5 h-3.5" />} Simpan
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div><label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1">{label}</label>{children}</div>
  );
}
