'use client'

import { TableSpinnerLoader } from "@/components/Loading";
import PreviewPage from "@/components/PreviewPage";
import Toast from "@/components/Toast";
import { DefaultConfigLayout, DefaultEwalletLayout, exampleHistoryData } from "@/lib/constanta";
import { ReceiptWithLayout, SettingsData } from "@/lib/types";
import { deleteReceipt, getAllReceipts } from "@/models/Receipt";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { FiCalendar, FiDatabase, FiPlus, FiSearch, FiTrash2, FiGrid, FiPrinter } from "react-icons/fi";

export default function PageHistoryClient({settingsData}: {settingsData: SettingsData | null}) {
  const [dataList, setDataList] = useState<Awaited<ReturnType<typeof getAllReceipts>>>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [strukData, setStrukData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const session = useSession();

  // Mengambil data dari database saat komponen dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if(session.status == "authenticated") {
          const data = await getAllReceipts();
          setDataList(data);
        } else {
          setDataList(exampleHistoryData as any)
        }
      } catch (error) {
        console.error("Gagal mengambil data struk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session.status]);

  const handleRePrint = (item: ReceiptWithLayout) => {
    setStrukData(item.content);
    if (item.layout && item.layout.config) {
      setConfig(item.layout.config);
    } else {
      if(item.layoutId == "DEFAULT_EWALLET_LAYOUT") {
        setConfig(DefaultEwalletLayout);
      } else {
        setConfig(DefaultConfigLayout);
      }
    }

    setShowModal(true);
  };

  // Filter pencarian berdasarkan nama struk
  const filteredData = dataList.filter((item) =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) return;

    if(session.status != 'authenticated') {
      setToast({ type: 'error', title: 'Error', message: "Anda harus login untuk menghapus data" });
      return;
    }

    try {
      const result = await deleteReceipt(id);
      if (result.success) {
        // Update state secara lokal agar UI langsung berubah
        setDataList((prev) => prev.filter((item) => item.id !== id));
        setToast({
          type: 'success',
          title: 'Berhasil',
          message: 'History berhasil dihapus'
        });
      } else {
        setToast({
          type: 'error',
          title: 'Gagal', 
          message: 'Gagal Menghapus History'
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Gagal',
        message: 'Terjadi kesalahan sistem saat menghapus data.'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-5 md:p-6 shadow-sm transition-colors duration-300">
        
      {/* Header Tabel & Kontrol */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-zinc-100">
            Data Riwayat Struk
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Kelola data riwayat struk digital Anda untuk melihat, mencetak, atau menghapus catatan transaksi sebelumnya sesuai kebutuhan.
          </p>
        </div>

        {/* Kolom Pencarian */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64 flex items-center bg-slate-100 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
            <FiSearch className="text-slate-400 w-4 h-4 shrink-0" />
            <input 
              type="text"
              placeholder="Cari nama history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs ml-2 w-full focus:outline-none text-slate-700 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* Wrapper Tabel */}
      <div className="overflow-hidden border border-slate-100 dark:border-zinc-800/60 rounded-2xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-800/20 border-b border-slate-100 dark:border-zinc-800/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400">Nama</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 hidden md:table-cell">Layout</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 hidden md:table-cell">Total</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 hidden md:table-cell">Tanggal</th>
              <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-zinc-400 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-sm font-medium">
            {loading ? (
              <TableSpinnerLoader colSpan={5} />
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => {
                // 1. Ambil nama layout dan batasi maksimal 10 karakter
                const rawLayoutName = item.layout?.name || "Default Layout";
                const namaLayout = rawLayoutName.length > 10 
                  ? `${rawLayoutName.slice(0, 10)}...` 
                  : rawLayoutName;

                // 2. Batasi karakter nama struk maksimal 30 karakter
                const namaStruk = item.nama.length > 30 ? `${item.nama.slice(0, 30)}...` : item.nama;

                // 3. Format tanggal createdAt dari database
                const tanggalBuat = new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    
                    {/* Kolom NAMA */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-slate-800 dark:text-zinc-100" title={item.nama}>
                          {namaStruk}
                        </p>
                        {/* Metadata tambahan opsional yang hanya muncul di HP / Mobile Screen */}
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal md:hidden mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{namaLayout}</span>
                          <span>•</span>
                          <span>Rp {(item.total || 0).toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>{tanggalBuat}</span>
                        </span>
                      </div>
                    </td>

                    {/* Kolom LAYOUT (Maksimal 10 Karakter - Desktop Only) */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" title={item.layout?.name || "Tanpa Layout"}>
                        <FiGrid className="w-3 h-3" />
                        {namaLayout}
                      </span>
                    </td>

                    {/* Kolom TOTAL (Desktop Only) */}
                    <td className="py-3.5 px-4 hidden md:table-cell font-extrabold text-slate-950 dark:text-white">
                      Rp {(item.total || 0).toLocaleString('id-ID')}
                    </td>

                    {/* Kolom TANGGAL (Desktop Only) */}
                    <td className="py-3.5 px-4 text-xs font-normal text-slate-400 dark:text-zinc-500 hidden md:table-cell">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {tanggalBuat}
                      </span>
                    </td>

                    {/* Kolom ACTION (Cetak & Hapus) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-1.5 md:gap-2">
                        
                        {/* Tombol Cetak */}
                        <button
                          onClick={() => handleRePrint(item)}
                          className="bg-slate-100 cursor-pointer hover:bg-blue-50 dark:bg-zinc-800/80 dark:hover:bg-blue-950/40 text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all flex items-center justify-center gap-1"
                          title="Cetak Struk"
                        >
                          <FiPrinter className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>

                        {/* Tombol Hapus */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-slate-100 cursor-pointer hover:bg-rose-50 dark:bg-zinc-800/80 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all flex items-center justify-center gap-1"
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
              // Tampilan jika data kosong atau tidak ditemukan hasil filternya
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                  <FiDatabase className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs font-bold">Data tidak ditemukan</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && (
          <div>
              <Toast toast={toast} setToast={setToast} />
          </div>
      )}

      {showModal && (
          <PreviewPage
            show={showModal}
            onClose={() => setShowModal(false)}
            formData={strukData} 
            setFormData={setStrukData}
            isGenerating={isGenerating}
            config={config}
            setIsGenerating={setIsGenerating}
            settings={settingsData as SettingsData | null}
          />
      )}
    </div>
  );
}