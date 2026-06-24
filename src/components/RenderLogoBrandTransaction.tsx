import { DEFAULT_NAME_APP } from "@/lib/constanta";
import { METHODEPAYMENT } from "@prisma/client";
import { BiCreditCard } from "react-icons/bi";

export default function RenderLogoBrandTransaction (id: string) {
    switch (id) {
      case "qris":
        return (
          <div className="flex items-center">
            <span className="font-extrabold text-blue-900 dark:text-white tracking-widest text-lg">QR</span>
            <span className="font-extrabold text-rose-500 tracking-wider text-lg">IS</span>
          </div>
        );
      case "gopay":
        return (
          <div className="flex items-center space-x-0.5">
            <span className="w-4 h-4 bg-[#00AED6] rounded-full inline-block"></span>
            <span className="font-bold text-[#00AED6] tracking-tight">Go</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">pay</span>
          </div>
        );
      case "shopeepay":
        return (
          <div className="flex items-center space-x-0.5">
            <span className="font-bold text-[#EE4D2D]">Shopee</span>
            <span className="px-1.5 py-0.5 bg-[#EE4D2D] text-white text-[10px] font-bold rounded">Pay</span>
          </div>
        );
      case "bca":
        return <span className="font-black text-blue-800 dark:text-blue-400 tracking-tight text-xl">BCA</span>;
      case "mandiri":
        return (
          <div className="flex flex-col items-start leading-none">
            <span className="font-extrabold text-blue-900 dark:text-zinc-200 tracking-tighter text-sm italic">mandırı</span>
            <span className="text-[9px] text-yellow-500 font-semibold uppercase tracking-wider">virtual account</span>
          </div>
        );
      case "bni":
        return <span className="font-extrabold text-teal-600 dark:text-teal-400 italic text-xl">BNI</span>;
      case "bri":
        return <span className="font-black text-[#00529C] dark:text-sky-400 text-xl tracking-tight">BRI</span>;
      default:
        return <BiCreditCard className="w-5 h-5 text-zinc-500" />;
    }
};

export function PaymentInstructions({ methodId, paymentCode }: { methodId: METHODEPAYMENT, paymentCode: string }) {
  const methodLower = methodId.toLowerCase();

  switch (methodLower) {
    case "qris":
      return (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">1</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Buka aplikasi e-wallet pilihan Anda (GoPay, OVO, Dana, LinkAja) atau M-Banking yang mendukung scan QRIS.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">2</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pilih menu Scan QR atau Bayar pada aplikasi tersebut.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">3</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Arahkan kamera HP ke arah barcode QRIS yang tampil di layar desktop, atau screenshoot jika Anda membuka lewat HP.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">4</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Periksa nominal total pembayaran dan pastikan nama merchant adalah {DEFAULT_NAME_APP}, lalu masukkan PIN untuk membayar.</p>
          </div>
        </div>
      );

    case "gopay":
    case "shopeepay":
      return (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">1</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pastikan aplikasi <span className="capitalize">{methodLower === "gopay" ? "Gojek" : "Shopee"}</span> sudah terinstal di smartphone Anda.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">2</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Klik tombol "Buka Aplikasi Sekarang" yang tersedia di atas.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">3</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Sistem akan otomatis mengarahkan Anda membuka aplikasi dan memunculkan halaman tinjauan pembayaran.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">4</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Konfirmasi pembayaran belanja Anda, lalu ketik PIN keamanan Anda. Transaksi akan langsung selesai.</p>
          </div>
        </div>
      );

    case "bca":
      return (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">1</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Login ke aplikasi BCA mobile (m-BCA).</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">2</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pilih menu m-Transfer lalu klik BCA Virtual Account.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">3</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Masukkan Nomor Virtual Account <strong className="font-mono bg-zinc-100 p-0.5 px-1 dark:bg-zinc-800 rounded">{paymentCode}</strong>, lalu klik Send.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">4</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Periksa rincian tagihan ReceiptApp Anda, klik OK, lalu masukkan PIN m-BCA Anda.</p>
          </div>
        </div>
      );

    case "bni":
      return (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">1</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Login ke BNI Mobile Banking.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">2</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pilih menu Transfer, kemudian pilih opsi Virtual Account Billing.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">3</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pilih rekening debet, lalu masukkan kode nomor VA <strong className="font-mono bg-zinc-100 p-0.5 px-1 dark:bg-zinc-800 rounded">{paymentCode}</strong> di kolom inputan.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">4</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Tagihan akan muncul otomatis. Masukkan Password Transaksi BNI Anda untuk memproses transfer.</p>
          </div>
        </div>
      );

    case "bri":
      return (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">1</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Login ke aplikasi BRImo (BRI Mobile).</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">2</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pilih fitur menu utama bernama BRIVA.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">3</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Klik "Tambah Transaksi Baru" lalu tempel nomor BRIVA <strong className="font-mono bg-zinc-100 p-0.5 px-1 dark:bg-zinc-800 rounded">{paymentCode}</strong>.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">4</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Konfirmasi nama tagihan merchant Anda, klik Bayar, lalu masukkan PIN aplikasi BRImo Anda.</p>
          </div>
        </div>
      );

    case "mandiri":
      // Pisahkan data bill_key dan biller_code yang digabung dari server action kemarin
      const [billKey, billerCode] = paymentCode.split(" | ");
      return (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">1</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Login ke aplikasi Livin' by Mandiri.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">2</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Pilih menu Bayar, lalu cari penyedia jasa / kode instansi perusahaan: <strong className="font-mono bg-zinc-100 p-0.5 px-1 dark:bg-zinc-800 rounded">{billerCode || "70012"}</strong>.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">3</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Masukkan kode No. Virtual Account / Bill Key Anda: <strong className="font-mono bg-zinc-100 p-0.5 px-1 dark:bg-zinc-800 rounded">{billKey}</strong>, lalu klik Lanjutkan.</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">4</span>
            <p className="text-xs pt-0.5 text-zinc-600 dark:text-zinc-400">Periksa nominal total tagihan langganan Anda, klik konfirmasi bayar, lalu masukkan PIN akun Livin Anda.</p>
          </div>
        </div>
      );

    default:
      return <p className="text-xs text-zinc-500">Petunjuk pembayaran tidak tersedia untuk metode ini.</p>;
  }
}