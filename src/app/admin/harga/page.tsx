import { LuDollarSign } from "react-icons/lu";
import { getAllLicenses } from "@/models/License";
import AdminHargaClient from "@/client/AdminHargaClient";

export default async function AdminHargaPage() {
  const licenses = await getAllLicenses({ sortBy: "levelLicense", order: "asc" });
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <LuDollarSign className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Paket Harga</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Kelola harga dan fitur setiap paket lisensi</p>
        </div>
      </div>
      <AdminHargaClient licenses={licenses} />
    </div>
  );
}
