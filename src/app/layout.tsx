import type { Metadata } from "next";
import "@/style/globals.css";
import { poppinsFont } from "@/lib/font";
import { PrinterProvider } from '../context/PrinterContext';
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "StrukApp - Buat Struk Digital dengan Mudah",
  description: "Aplikasi Pembuatan Struk Digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppinsFont.variable} antialiased bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 min-h-screen flex flex-col`}>
        <SessionProvider>
          <ThemeProvider>
            <PrinterProvider>
              {children}
            </PrinterProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
  