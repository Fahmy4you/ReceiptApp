import { LuHistory } from "react-icons/lu";
import AdminStrukClient from "@/client/AdminStrukClient";

export default async function AdminStrukPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <LuHistory className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Semua Struk</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Riwayat struk dari seluruh pengguna</p>
        </div>
      </div>
      <AdminStrukClient />
    </div>
  );
}
