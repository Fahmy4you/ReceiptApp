import { LuShield, LuDollarSign, LuRefreshCcw, LuHistory } from "react-icons/lu";
import Link from "next/link";

export default async function AdminPage() {
  const cards = [
    { href: "/admin/harga", icon: LuDollarSign, label: "Paket Harga", desc: "Kelola harga dan fitur lisensi" },
    { href: "/admin/kuota", icon: LuRefreshCcw, label: "Kuota Gratis", desc: "Atur token per hari & maksimal layout" },
    { href: "/admin/struk", icon: LuHistory, label: "Semua Struk", desc: "Riwayat struk seluruh pengguna" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
          <LuShield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Panel Admin</h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Pilih menu di sidebar atau kartu di bawah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:shadow-lg dark:hover:shadow-black/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm mb-1">{card.label}</h3>
            <p className="text-xs text-slate-400">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
