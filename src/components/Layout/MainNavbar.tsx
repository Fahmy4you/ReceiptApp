'use client';

import { useEffect, useState } from 'react'
import { FiBell, FiGrid, FiMoon, FiSun } from 'react-icons/fi';

const MainNavbar = () => {
    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        
        if (savedTheme === 'light') {
          setDarkMode(false);
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          setDarkMode(true);
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      }, []);
    
      const toggleTheme = () => {
        const nextMode = !darkMode;
        setDarkMode(nextMode);
        if (nextMode) {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
          localStorage.setItem('theme', 'light');
        }
      };

  return (
    <header className="h-16 w-full border-b border-slate-200 dark:border-zinc-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-30 fixed top-0">
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-violet-600 text-violet-500 bg-violet-500/10 border-violet-500/20 shadow-violet-500/25 focus-within:border-violet-500 flex items-center justify-center text-white shadow-lg`}>
            <FiGrid className="w-5 h-5" />
            </div>
            <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none">ReceiptApp - Buat Struk Digital dengan Mudah</h1>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Application v1.0</span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
            title="Ganti Tema"
            >
            {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors relative"
            >
                <FiBell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>

            <span className="w-px h-6 bg-slate-200 dark:bg-zinc-800 hidden md:block"></span>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2">
            <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Profil"
                className="w-8 h-8 rounded-xl object-cover border border-blue-500/20 shadow-sm"
                onError={(e) => {
                e.currentTarget.src = "https://placehold.co/100x100/4f46e5/ffffff?text=AP";
                }}
            />
            <span className="text-xs font-bold hidden md:block">Andika Pratama</span>
            </div>
        </div>
        </header>
  )
}

export default MainNavbar
