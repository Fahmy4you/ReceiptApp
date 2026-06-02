import { AlertLine } from "@/components/AlertLine";
import MainBottomBar from "@/components/Layout/MainBottomBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {/* <MainNavbar/>
      <div className="pt-16">
        {children}
        </div> */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-28 md:pb-32">
        <AlertLine className="-mt-3 mb-3" message="Semua Yang Ditampilkan Disini Adalah Data Global, Login Untuk Menyesuaikan Data" type="warning"/>
        {children}
      </main>
      <MainBottomBar/>
    </div>
  );
}
  