'use client';
import React, { useEffect } from 'react';
import { 
  FiCheckCircle as CheckCircle, 
  FiAlertCircle as AlertCircle, 
  FiInfo as Info,               
  FiAlertTriangle as TriangleAlert, 
  FiX as X                   
} from 'react-icons/fi'; 

// Tipe untuk varian Alert
export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  message: string;
  type?: AlertType;
  onClose?: () => void;
  autoClose?: number; // Durasi dalam ms (misal 3000)
  className?: string;
}

export const AlertLine: React.FC<AlertProps> = ({ 
  message, 
  type = 'info', 
  onClose, 
  autoClose,
  className = "" 
}) => {
  
  // Logika Auto Close
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  // Konfigurasi Style berdasarkan tipe
  const config = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-500',
      icon: <CheckCircle size={18} className="shrink-0" />,
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-500',
      icon: <AlertCircle size={18} className="shrink-0" />,
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-500',
      icon: <Info size={18} className="shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-500',
      icon: <TriangleAlert size={18} className="shrink-0" />,
    },
  };

  const style = config[type];

  return (
    <div 
      className={`
        flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300
        ${style.bg} ${style.text} ${className}
      `}
    >
      {/* Icon Utama */}
      {style.icon}

      {/* Pesan */}
      <p className="text-sm font-medium flex-1">
        {message}
      </p>

      {/* Tombol Close (Jika fungsi onClose tersedia) */}
      {onClose && (
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
