'use client'

import { TableSpinnerLoader } from "@/components/Loading";
import Toast from "@/components/Toast";
import PreviewPage from "@/components/PreviewPage"; // <-- Pastikan impor ini sesuai path kamu
import { exampleLayoutData } from "@/lib/constanta";
import { SettingsData } from "@/lib/types";
import { deleteLayout, getAllLayouts } from "@/models/Layout";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiCalendar, FiDatabase, FiEdit2, FiPlus, FiSearch, FiTrash2, FiEye } from "react-icons/fi";
import { normalizeKey } from "@/lib/Helpers";

export default function PageLayoutListClient({settingsData}: {settingsData: SettingsData | null}) {
  const [layouts, setLayouts] = useState<Awaited<ReturnType<typeof getAllLayouts>>>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const session = useSession();
  const router = useRouter();

  // --- STATE UNTUK PREVIEW MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any[]>([]);
  const [strukData, setStrukData] = useState<Record<string, any>>({});

  // Ambil data dari database saat komponen pertama kali dimuat
  const fetchData = async () => {
    try {
      setLoading(true);
      if(session.status == "authenticated") {
        const data = await getAllLayouts();
        setLayouts(data);
      } else {
        setLayouts(exampleLayoutData as any);
      }
    } catch (error) {
      console.error("Gagal memuat data layout:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session.status]);

  // Filter pencarian client-side berdasarkan nama layout
  const filteredLayouts = layouts.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePreview = (item: any) => {
    // Amankan jika ternyata item.config dari database masih berbentuk string JSON
    let configArray = item.config;
    if (typeof configArray === 'string') {
      try {
        configArray = JSON.parse(configArray);
      } catch (e) {
        console.error("Gagal parse JSON config:", e);
        configArray = [];
      }
    }

    // Bangun formData menggunakan normalizeKey(label) agar match dengan PreviewPage
    const extractedFormData: Record<string, any> = {
      showAdmin: true, // Berikan default value seperti di manual page
    };
    
    if (Array.isArray(configArray)) {
      configArray.forEach((cfg) => {
        if (cfg.type === 'input_text' && cfg.label) {
          // Ganti key dari cfg.dataType menjadi normalizeKey(cfg.label)
          const key = normalizeKey(cfg.label);
          extractedFormData[key] = cfg.exampleValue || "";
        }
      });
    }

    // Set semua state preview khusus untuk item yang diklik ini
    setSelectedConfig(configArray);
    setStrukData(extractedFormData); 
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) return;

    if(session.status != 'authenticated') {
      setToast({ type: 'error', title: 'Error', message: "Anda harus login untuk menghapus data" });
      return;
    }

    try {
      const result = await deleteLayout(id);
      if (result.success) {
        setLayouts((prev) => prev.filter((item) => item.id != id));
        setToast({ type: 'success', title: 'Berhasil', message: 'Layout berhasil dihapus' });
      } else {
        setToast({ type: 'error', title: 'Gagal', message: 'Gagal Menghapus Layout' });
      }
    } catch (error) {
      setToast({ type: 'error', title: 'Gagal', message: 'Terjadi kesalahan sistem saat menghapus data.' });
    }
  };

  const handleEdit = (id: string) => {
    if (session.status != 'authenticated') {
      setToast({ type: 'error', title: 'Error', message: "Anda harus login untuk mengedit data" });
      return;
    }
    router.push(`/layout/${id}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-5 md:p-6 shadow-sm transition-colors duration-300">
        
      {/* Header Tabel & Kontrol */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Data Layout Struk
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Kelola data layout struk data sesuai kebutuhan untuk mengatur tampilan struk digital Anda secara optimal.
          </p>
        </div>

        {/* Kolom Pencarian */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64 flex items-center bg-slate-100 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
            <FiSearch className="text-slate-400 w-4 h-4 shrink-0" />
            <input 
              type="text"
              placeholder="Cari nama layout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs ml-2 w-full focus:outline-none text-slate-700 dark:text-zinc-200"
            />
          </div>
          
          <Link href="/layout/add" 
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10 shrink-0"
          >
            <FiPlus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Tambah</span>
          </Link>
        </div>
      </div>

      {/* Wrapper Tabel */}
      <div className="overflow-hidden border border-slate-100 dark:border-zinc-800/60 rounded-2xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-800/20 border-b border-slate-100 dark:border-zinc-800/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400">Nama</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 hidden md:table-cell">Struktur (JSON)</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 hidden md:table-cell">Tanggal dibuat</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-sm font-medium">
            {loading ? (
              <TableSpinnerLoader colSpan={5} />
            ) : filteredLayouts.length > 0 ? (
              filteredLayouts.map((item) => {
                const namaLayout = item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name;
                const jumlahKontenJson = Object.keys((item.config as object) || {}).length;
                const tanggalBuat = new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 dark:text-zinc-100" title={item.name}>
                            {namaLayout}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal md:hidden mt-0.5 flex items-center gap-2">
                          <span>{jumlahKontenJson} Elemen</span>
                          <span>•</span>
                          <span>{tanggalBuat}</span>
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        <FiDatabase className="w-3 h-3" />
                        {jumlahKontenJson} Fields / Keys
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-normal text-slate-400 dark:text-zinc-500 hidden md:table-cell">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {tanggalBuat}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-1.5 md:gap-2">
                        
                        {/* Tombol Preview Berubah ke handlePreview(item) */}
                        <button
                          onClick={() => handlePreview(item)}
                          className="cursor-pointer bg-slate-100 hover:bg-emerald-50 dark:bg-zinc-800/80 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title="Preview Layout"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button 
                          onClick={() => handleEdit(item.id)}
                          className="cursor-pointer bg-slate-100 hover:bg-blue-50 dark:bg-zinc-800/80 dark:hover:bg-blue-950/40 text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title="Edit Data">
                          <FiEdit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-slate-100 cursor-pointer hover:bg-rose-50 dark:bg-zinc-800/80 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 px-2.5 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title="Hapus Data"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                  <FiDatabase className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs font-bold">Data tidak ditemukan</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- KOMPONEN MODAL PREVIEW YANG TERINTERGASI DATA DINAMIS --- */}
      <PreviewPage
        show={showModal}
        onClose={() => setShowModal(false)}
        formData={strukData} 
        setFormData={setStrukData}
        isGenerating={isGenerating}
        config={selectedConfig} 
        setIsGenerating={setIsGenerating}
        settings={settingsData}
      />

      {toast && (
          <div>
              <Toast toast={toast} setToast={setToast} />
          </div>
      )}
    </div>
  );
}