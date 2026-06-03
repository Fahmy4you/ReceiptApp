'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuCamera, LuFileText, LuGrid2X2, LuHistory, LuLayers3, LuSettings } from 'react-icons/lu'

const MainBottomBar = () => {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-40 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 dark:to-transparent pointer-events-none flex justify-center">
            <nav className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-zinc-900/95 backdrop-blur-lg border border-slate-200/80 dark:border-zinc-800/80 h-16 md:h-20 rounded-2xl md:rounded-3xl px-4 flex items-center justify-between pointer-events-auto shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
            
                <LinkChildren href="/" icon={LuGrid2X2} label="Home" pathname={pathname} />

                <LinkChildren href="/layout" icon={LuLayers3} label="Layout" pathname={pathname} />

                <div className="relative -top-5 md:-top-7 flex items-center gap-2 px-1">
                    <Link href="/upload"
                        className={`w-12 h-12 md:w-15 md:h-15 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex flex-col items-center justify-center text-white shadow-lg shadow-blue-500/30 active:scale-95 hover:scale-105 transition-all group relative border border-white/20 dark:border-zinc-800/20 ${
                            pathname === '/upload' ? 'ring-4 ring-blue-500/30' : ''
                        }`}
                        title="Upload"
                    >
                        <LuCamera className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upload</span>
                    </Link>

                    <Link href="/manual"
                        className={`w-12 h-12 md:w-15 md:h-15 rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 flex flex-col items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 hover:scale-105 transition-all group relative border border-white/20 dark:border-zinc-800/20 ${
                            pathname === '/manual' ? 'ring-4 ring-sky-500/30' : ''
                        }`}
                        title="Manual"
                    >
                        <LuFileText className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Manual</span>
                    </Link>
                </div>

                <LinkChildren href="/history" icon={LuHistory} label="History" pathname={pathname} />

                <LinkChildren href="/settings" icon={LuSettings} label="Settings" pathname={pathname} />

            </nav>
        </div>
    )
}

// Komponen Anak untuk Tab Navigasi Link
const LinkChildren = ({ 
  icon: Icon, 
  label, 
  href, 
  pathname 
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string; 
  pathname: string;
}) => {
    // LOGIKA COCOKAN ROUTE AKTIF:
    // 1. Jika href adalah '/' (root), tab hanya aktif jika pathname tepat '/'
    // 2. Jika href selain '/', tab aktif jika pathname sama persis dengan href ATAU dimulai dengan "href/" (untuk sub-path seperti /layout/create)
    const isActive = href === '/' 
      ? pathname === '/' 
      : pathname === href || pathname.startsWith(href + '/');

    return (
        <Link href={href}
            className={`flex flex-col cursor-pointer items-center justify-center gap-1 w-14 h-12 rounded-xl transition-all duration-300 ${
            isActive 
              ? 'text-blue-500 scale-105 font-black' 
              : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
            }`}
        >
            <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 ${isActive ? 'stroke-[2.5] scale-110' : ''}`} />
            <span className="text-[9px] md:text-[10px] tracking-wide">{label}</span>
        </Link>
    )
}

export default MainBottomBar
