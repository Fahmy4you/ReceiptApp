"use client";
import React, { useEffect } from 'react'
import { FiInfo, FiX } from 'react-icons/fi'

const Toast = ({ toast, setToast }: {toast: { type: 'success' | 'error' | 'info'; title: string; message: string }; setToast: (toast: null) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast, setToast]);
  
  return (
    <div className="fixed z-[999] top-6 right-4 left-4 md:left-auto md:w-96 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl z-50 flex gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
            : toast.type === 'error' 
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' 
              : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
            }`}>
            <FiInfo className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
            <h5 className="font-extrabold text-sm">{toast.title}</h5>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{toast.message}</p>
        </div>
        <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
            <FiX className="w-4 h-4" />
        </button>
    </div>
  )
}

export default Toast
