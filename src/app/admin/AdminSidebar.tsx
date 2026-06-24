'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuShield, LuDollarSign, LuRefreshCcw, LuHistory, LuArrowLeft, LuLayoutDashboard } from 'react-icons/lu';

const menuItems = [
  { href: '/admin', icon: LuLayoutDashboard, label: 'Dashboard' },
  { href: '/admin/harga', icon: LuDollarSign, label: 'Paket Harga' },
  { href: '/admin/kuota', icon: LuRefreshCcw, label: 'Kuota Gratis' },
  { href: '/admin/struk', icon: LuHistory, label: 'Semua Struk' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col z-50">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <LuShield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight">Admin Panel</h2>
            <p className="text-[10px] text-slate-400">ReceiptApp</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-all"
        >
          <LuArrowLeft className="w-4 h-4" />
          <span>Kembali ke App</span>
        </Link>
      </div>
    </aside>
  );
}
