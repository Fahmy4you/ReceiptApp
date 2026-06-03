import { LuRefreshCcw } from "react-icons/lu";
import { getAllLicenses } from "@/models/License";
import AdminKuotaClient from "@/client/AdminKuotaClient";

export default async function AdminKuotaPage() {
  const licenses = await getAllLicenses({ sortBy: "levelLicense", order: "asc" });
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <LuRefreshCcw className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Kuota Gratis</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Atur token per hari dan maksimal layout untuk Free Tier</p>
        </div>
      </div>
      <AdminKuotaClient licenses={licenses} />
    </div>
  );
}
