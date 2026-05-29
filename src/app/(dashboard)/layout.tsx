import type { Metadata } from "next";
import "@/style/globals.css";
import { poppinsFont } from "@/lib/font";
import MainBottomBar from "@/components/Layout/MainBottomBar";

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
    <html lang="en" data-theme="dark">
      <body className={`${poppinsFont.variable} antialiased bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 min-h-screen flex flex-col`}>
        {/* <MainNavbar/>
        <div className="pt-16">
          {children}
          </div> */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-28 md:pb-32">
          {children}
        </main>
        <MainBottomBar/>
      </body>
    </html>
  );
}
  