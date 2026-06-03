'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllReceiptsAdmin } from '@/models/Receipt';
import { updateLicense } from '@/models/License';
import { LuShield, LuDollarSign, LuRefreshCcw, LuHistory, LuSearch, LuLoader, LuSave, LuChevronLeft, LuChevronRight, LuEye, LuEyeOff } from 'react-icons/lu';
import { formatIDR } from '@/lib/Helpers';
import Toast from '@/components/Toast';
import { TableSpinnerLoader } from '@/components/Loading';

type License = {
  id: string;
  name: string;
  description: string;
  features: any;
  colorTheme: string;
  buttonTheme: string;
  priceMonthly: number;
  priceYearly: number;
  discount: number | null;
  levelLicense: number;
  icon: string;
};

type Receipt = {
  id: string;
  nama: string;
  userId: string;
  type: string;
  total: number | null;
  createdAt: Date;
  user: { id: string; name: string | null; email: string | null } | null;
};

type ToastState = { type: 'success' | 'error' | 'info'; title: string; message: string } | null;

type TabKey = 'harga' | 'kuota' | 'history';

export default function PageAdminClient({ licenses: initialLicenses }: { licenses: License[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>('harga');
  const [toast, setToast] = useState<ToastState>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <LuShield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Panel Admin</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Kelola harga, kuota, dan data struk</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/50 w-fit">
        <TabButton active={activeTab === 'harga'} onClick={() => setActiveTab('harga')} icon={LuDollarSign} label="Paket Harga" />
        <TabButton active={activeTab === 'kuota'} onClick={() => setActiveTab('kuota')} icon={LuRefreshCcw} label="Kuota Gratis" />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={LuHistory} label="Semua Struk" />
      </div>

      {toast && <Toast toast={toast} setToast={setToast} />}

      {activeTab === 'harga' && <TabHarga licenses={initialLicenses} setToast={setToast} />}
      {activeTab === 'kuota' && <TabKuota licenses={initialLicenses} setToast={setToast} />}
      {activeTab === 'history' && <TabHistory setToast={setToast} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        active
          ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

/* ─── TAB 1: PAKET HARGA ─── */
function TabHarga({ licenses, setToast }: { licenses: License[]; setToast: (t: ToastState) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (license: License) => {
    setSaving(true);
    try {
      const res = await updateLicense(license.id, {
        name: license.name,
        description: license.description,
        features: license.features,
        colorTheme: license.colorTheme,
        buttonTheme: license.buttonTheme,
        priceMonthly: license.priceMonthly,
        priceYearly: license.priceYearly,
        discount: license.discount,
        icon: license.icon,
      });
      if (res.success) {
        setToast({ type: 'success', title: 'Berhasil', message: 'Paket harga berhasil diperbarui' });
        setEditingId(null);
      } else {
        setToast({ type: 'error', title: 'Gagal', message: res.error || 'Terjadi kesalahan' });
      }
    } catch (err: any) {
      setToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
      <h2 className="font-bold text-sm mb-4">Daftar Paket Lisensi</h2>
      <div className="space-y-3">
        {licenses.map((lic) => (
          <LicenseCard
            key={lic.id}
            license={lic}
            isEditing={editingId === lic.id}
            onEdit={() => setEditingId(lic.id)}
            onCancel={() => setEditingId(null)}
            onSave={(updated) => handleSave(updated)}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}

function LicenseCard({
  license,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving,
}: {
  license: License;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (l: License) => void;
  saving: boolean;
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
        <button onClick={onEdit} className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors cursor-pointer">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nama Paket">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
        <Field label="Deskripsi">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
        <Field label="Harga Bulanan (Rp)">
          <input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
        <Field label="Harga Tahunan (Rp)">
          <input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
        <Field label="Diskon (%)">
          <input type="number" value={form.discount ?? 0} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
        <Field label="Icon (SVG)">
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium font-mono" />
        </Field>
        <Field label="Token per Hari" className="md:col-span-1">
          <input value={(form.features as any)?.token_perhari_yang_didapat || ''} onChange={(e) => setForm({ ...form, features: { ...form.features, token_perhari_yang_didapat: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
        <Field label="Maksimal Layout">
          <input value={(form.features as any)?.maksimal_layout || ''} onChange={(e) => setForm({ ...form, features: { ...form.features, maksimal_layout: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium" />
        </Field>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50">
          Batal
        </button>
        <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
          {saving ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuSave className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

/* ─── TAB 2: KUOTA GRATIS ─── */
function TabKuota({ licenses, setToast }: { licenses: License[]; setToast: (t: ToastState) => void }) {
  const freeTier = licenses.find((l) => l.id === 'l-free-tier');
  const [tokenPerDay, setTokenPerDay] = useState('');
  const [maxLayout, setMaxLayout] = useState('');
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

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
      const res = await updateLicense(freeTier.id, {
        features: { token_perhari_yang_didapat: tokenPerDay, maksimal_layout: maxLayout },
      } as any);
      if (res.success) {
        setToast({ type: 'success', title: 'Berhasil', message: 'Kuota gratis berhasil diperbarui' });
        setChanged(false);
      } else {
        setToast({ type: 'error', title: 'Gagal', message: res.error || 'Terjadi kesalahan' });
      }
    } catch (err: any) {
      setToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!freeTier) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <p className="text-xs text-slate-400">Paket Free Tier tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
      <h2 className="font-bold text-sm mb-1">Pengaturan Paket Gratis</h2>
      <p className="text-xs text-slate-400 dark:text-zinc-500 mb-4">Ubah batas harian dan layout untuk pengguna Free Tier</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700/50">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Token per Hari</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={tokenPerDay}
              onChange={(e) => { setTokenPerDay(e.target.value); setChanged(true); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold"
            />
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700/50">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Maksimal Layout</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={maxLayout}
              onChange={(e) => { setMaxLayout(e.target.value); setChanged(true); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold"
            />
          </div>
        </div>
      </div>

      {changed && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuSave className="w-3.5 h-3.5" />}
          Simpan Perubahan
        </button>
      )}
    </div>
  );
}

/* ─── TAB 3: SEMUA STRUK ─── */
function TabHistory({ setToast }: { setToast: (t: ToastState) => void }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const perPage = 15;

  const fetchData = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await getAllReceiptsAdmin({
        search: searchTerm || undefined,
        limit: 100,
      });
      setReceipts(data as any);
    } catch (err: any) {
      setToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [setToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = search
    ? receipts.filter((r) =>
        r.nama.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : receipts;

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const showPagination = filtered.length > perPage;
  const [showUserIds, setShowUserIds] = useState(false);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm">Semua Riwayat Struk</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Cari nama/user..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs w-48"
            />
          </div>
          <button
            onClick={() => setShowUserIds(!showUserIds)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={showUserIds ? 'Sembunyikan ID User' : 'Tampilkan ID User'}
          >
            {showUserIds ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {paged.length > 0 && (
        <p className="text-[10px] text-slate-400 mb-3">
          Menampilkan {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} dari {filtered.length} struk
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-700/50">
              <Th>Nama</Th>
              <Th>User</Th>
              {showUserIds && <Th>ID User</Th>}
              <Th>Tipe</Th>
              <Th>Total</Th>
              <Th>Tanggal</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSpinnerLoader colSpan={showUserIds ? 6 : 5} />
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={showUserIds ? 6 : 5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <LuHistory className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                    <p className="text-xs text-slate-400">Belum ada data struk</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-2 font-medium max-w-[140px] truncate">{r.nama}</td>
                  <td className="py-3 px-2 text-slate-500 max-w-[120px] truncate">{r.user?.name || r.user?.email || '-'}</td>
                  {showUserIds && <td className="py-3 px-2 text-[10px] font-mono text-slate-400 max-w-[100px] truncate">{r.userId}</td>}
                  <td className="py-3 px-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.type === 'RECEIPT_UPLOAD' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>
                      {r.type === 'RECEIPT_UPLOAD' ? 'Upload' : 'Manual'}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-bold">{r.total ? formatIDR(r.total) : '-'}</td>
                  <td className="py-3 px-2 text-slate-400 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30"
          >
            <LuChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                i === page ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30"
          >
            <LuChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2.5 px-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide text-left">{children}</th>;
}
