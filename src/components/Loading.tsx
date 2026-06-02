import React from 'react';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg ${className}`} />
);

export default function LoadingScreenSkeleton() {
  return (
    <div className="min-h-screen min-w-full absolute top-0 left-0 p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-48 h-6" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="hidden md:block">
            <Skeleton className="w-24 h-4 mb-2" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
      </div>

      {/* Welcome Message Skeleton */}
      <div className="mb-10">
        <Skeleton className="w-3/4 md:w-1/3 h-10 mb-3" />
        <Skeleton className="w-1/2 md:w-1/4 h-5" />
      </div>

      {/* Stats Grid Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex justify-between items-start"
          >
            <div>
              <Skeleton className="w-20 h-4 mb-4" />
              <Skeleton className="w-16 h-8" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Action Cards Skeleton (2 Large Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div 
            key={i} 
            className="relative overflow-hidden p-8 h-48 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl flex items-center gap-6"
          >
            {/* Glassmorphism accent */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
            
            <Skeleton className="shrink-0 w-16 h-16 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="w-40 h-6 mb-3" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Loading Overlay (Optional subtle text) */}
      <div className="fixed top-8 right-8 flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-lg">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Menyiapkan Dashboard...</span>
      </div>
    </div>
  );
}

import { FiLoader } from "react-icons/fi";

export function TableSpinnerLoader({ colSpan = 5 }: { colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center relative">
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Spinner Wrapper dengan Efek Glow */}
          <div className="relative flex items-center justify-center">
            {/* Efek Lingkaran Glow di Belakang (Hanya tampak samar) */}
            <div className="absolute w-8 h-8 rounded-full bg-blue-500/20 blur-md animate-pulse" />
            
            {/* Ikon Spinner Utama */}
            <FiLoader className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin stroke-[2.5]" />
          </div>
          
          {/* Teks Indikator */}
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 tracking-wide">
              Sinkronisasi Data
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 animate-pulse">
              Mohon tunggu sebentar...
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}