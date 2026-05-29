"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface PrinterContextType {
  printerDevice: any;
  setPrinterDevice: (device: any) => void;
  isPrinterConnected: boolean;
  setIsPrinterConnected: (status: boolean) => void;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [printerDevice, setPrinterDevice] = useState<any>(null);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);

  // Pantau jika koneksi terputus tiba-tiba
  useEffect(() => {
    if (printerDevice) {
      const handleDisconnect = () => {
        setIsPrinterConnected(false);
        setPrinterDevice(null);
      };
      printerDevice.addEventListener('gattserverdisconnected', handleDisconnect);
      return () => printerDevice.removeEventListener('gattserverdisconnected', handleDisconnect);
    }
  }, [printerDevice]);

  return (
    <PrinterContext.Provider value={{ printerDevice, setPrinterDevice, isPrinterConnected, setIsPrinterConnected }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) throw new Error("usePrinter harus digunakan di dalam PrinterProvider");
  return context;
};