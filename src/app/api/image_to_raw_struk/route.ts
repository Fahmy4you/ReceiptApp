import { GoogleGenAI, Type } from "@google/genai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ID_LICENSE_FREE } from "@/lib/constanta";
import { prisma } from "@/lib/prisma";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    // 1. Validasi Device Fingerprint via Cookies
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('device_fingerprint')?.value;

    if (!deviceId) {
      return NextResponse.json({ error: "ID Perangkat tidak ditemukan" }, { status: 400 });
    }

    // 2. Validasi Sesi & Kuota OCR User
    const session = await auth();
    if (session?.user?.id) {
      const rows = await prisma.$queryRawUnsafe<Array<{ kuota: number, license_id: string }>>(
        `SELECT kuota, license_id FROM "user" WHERE id = $1 LIMIT 1`, session.user.id
      );
      const userKuota = rows?.[0]?.kuota ?? 0;
      const licenseId = rows?.[0]?.license_id ?? ID_LICENSE_FREE;
      if (userKuota <= 0 && licenseId != "l-platinum-tier") {
        return NextResponse.json({ error: "Kuota OCR habis. Isi ulang kuota untuk melanjutkan." }, { status: 403 });
      }
    }
    
    // 3. Destrukturisasi Payload Request
    const { imageBase64, mimeType, targetFields } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Gambar kosong" }, { status: 400 });

    // 4. Pembentukan Skema Properti secara Dinamis (Fokus Bersih pada Key)
    const propertiesSchema: Record<string, any> = {};
    
    targetFields.forEach((field: any) => {
      const keyLower = (field.key || "").toLowerCase();
      const dataTypeLower = (field.dataType || "").toLowerCase();
      let finalDescription = "";

      // Pemetaan instruksi pendek dan super ketat berdasarkan KEY uniknya saja
      if (keyLower === "penerima_bank") {
        finalDescription = "Nama perusahaan, nama instansi, atau nama aplikasi e-wallet TUJUAN akhir dana ditransfer. Contoh di gambar: 'Shopee Indonesia' atau 'ShopeePay'. JANGAN PERNAH diisi dengan 'Bank Mandiri'!";
      } 
      else if (keyLower === "penerima_rekening") {
        finalDescription = "Nomor Virtual Account (VA) atau nomor akun rekening tujuan pihak penerima dana. Contoh di gambar: '896085161609088'. JANGAN PERNAH mengambil nomor rekening masked pembayar!";
      } 
      else if (keyLower === "penerima_nama") {
        finalDescription = "Nama pemilik akun atau nama masked tujuan penerima manfaat transfer. Contoh di gambar: 'wXXXXXXXXXXXXX3'. JANGAN PERNAH diisi dengan nama pengirim 'HERMAWAN WIDARTA'!";
      } 
      else if (keyLower === "penerima_nominal" || keyLower.includes("nomin") || keyLower.includes("total")) {
        finalDescription = "Angka nominal uang transaksi utama yang riil sebelum ditambahkan dengan biaya admin/transaksi. Contoh di gambar: '12900'.";
      } 
      else if (keyLower === "tanggal") {
        finalDescription = "Tanggal ketika transaksi pembayaran sukses dilakukan. Format wajib: 'DD MMM YYYY', Contoh: '12 Apr 2026'.";
      } 
      else if (keyLower === "waktu") {
        finalDescription = "Waktu atau jam terjadinya transaksi. Contoh format: '06:10:40'.";
      } 
      else if (keyLower === "kode_referensi") {
        finalDescription = "Nomor referensi, Reference No, atau ID Transaksi resmi dari pihak bank. Contoh di gambar: '702604120610301933'.";
      } 
      else if (dataTypeLower === "date" || keyLower.includes("tanggal") || keyLower.includes("periode")) {
        finalDescription = "Field bertipe tanggal atau periode waktu transaksi. Cari teks penanda waktu di gambar. Jika teks berupa format angka mentah penanda bulan/tahun tanpa tanggal hari (seperti '202606' atau '2026/06'), ubah otomatis secara cerdas menjadi nama bulan singkat dan tahun dengan format 'MMM YYYY' (Contoh: 'Jun 2026'). Jika ada tanggal lengkapnya, gunakan format 'DD MMM YYYY' (Contoh: '12 Apr 2026').";
      }
      else {
        finalDescription = `Ekstrak nilai data secara akurat untuk field ${field.key}. Jika benar-benar tidak tertera di gambar bukti transaksi, isi dengan string "null".`;
      }

      propertiesSchema[field.key] = {
        type: Type.STRING,
        description: finalDescription,
      };
    });

    // 5. Response Schema Penampung Hasil Akhir
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        is_layout_sesuai: {
          type: Type.BOOLEAN,
          description: "Berikan nilai false JIKA gambar bukan struk transaksi/nota belanja/bukti bayar yang valid. Set true jika jenis struk sesuai.",
        },
        error_layout: {
          type: Type.STRING,
          description: "Isi 'Gambar tidak sesuai dengan permintaan layout, buat layout baru' HANYA jika is_layout_sesuai false.",
        },
        data: {
          type: Type.OBJECT,
          description: "Hasil ekstraksi data transaksi.",
          properties: propertiesSchema,
        }
      },
      required: ["is_layout_sesuai", "error_layout"],
    };

    // 6. Prompt Utama Panduan Analisis Struktur Transaksi
    const prompt = `Tugas Anda adalah melakukan validasi dan ekstraksi data secara kontekstual dari gambar bukti transaksi yang diberikan (Bisa berupa struk transfer m-banking, struk thermal PPOB, token PLN, pulsa, atau e-wallet).

    Langkah Kerja Wajib:
    1. Analisis alur data transaksi pada gambar secara menyeluruh. Pahami entitas mana yang bertindak sebagai Pengirim (Asal Dana / Pembayar) dan mana yang bertindak sebagai Penerima/Tujuan Manfaat (Penyedia Jasa / No. Pelanggan / VA / Instansi Tujuan).
    2. Lakukan ekstraksi data ke dalam objek 'data' dengan mematuhi secara mutlak batasan instruksi spesifik yang tertera pada deskripsi masing-masing field di 'responseSchema'.
    3. JANGAN PERNAH mencampuradukkan data milik Pengirim/Sumber Dana ke dalam field yang dideklarasikan khusus untuk Penerima/Tujuan, begitupun sebaliknya.

    Catatan Pengolahan Nilai (WAJIB):
    - Format Tanggal: Wajib format "DD MMM YYYY" (Contoh: "12 Apr 2026").
    - Jika ada nama dipisahkan dengan "-" atau "_" seperti "FAHMY-BIMA" maka hapus itu dan ganti dengan spasi "FAHMY BIMA"
    - Bersihkan spasi, tanda minus (-), dan karakter non-angka pada No.HP, No.Rekening, No.Meteran, dan No.VA.
    - Untuk nilai nominal/uang, bersihkan dari simbol (Rp, IDR), titik, koma, serta angka desimal sen (,00). Hasil akhir wajib berupa ANGKA MURNI (Contoh: "12900").
    - Jika ada token listrik atau token apapun itu tolong pisahkah value nya setiap 4 angka menggunakan - (Contoh: "5748-1459-9030-2193-2921")
    - Gabungkan baris "STAND" dan "METER" jika posisinya berurutan menjadi satu kesatuan informasi, yaitu "STAND METER". Nilai dari stand meter tersebut adalah rentang angka di sebelahnya (Contoh: "00036267-00036601").
    `;

    const contents = [
      { 
        inlineData: { 
          mimeType: mimeType || "image/jpeg", 
          data: imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64 
        } 
      },
      { text: prompt },
    ];

    const availableModels = [
      "gemini-3-flash-preview", 
      "gemini-3.1-flash-lite-preview", 
      "gemini-2.5-flash-lite"
    ];

    let lastError;

    for (const modelName of availableModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 detik

      try {
        console.log(`Mencoba model: ${modelName}`);
        const result = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            abortSignal: controller.signal
          }
        });

        clearTimeout(timeoutId);

        if (!result || !result.text) {
          throw new Error(`Response dari ${modelName} kosong`);
        }
        
        const parsedResult = JSON.parse(result.text);

        if (parsedResult.is_layout_sesuai === false || parsedResult.error_layout) {
          return NextResponse.json({ 
            success: false,
            error: parsedResult.error_layout || "Gambar tidak sesuai dengan permintaan layout, buat layout baru"
          });
        }

        // =======================================================================
        // 🛠️ PROSES MEMBERSIHKAN KEY SEBELUM DIKIRIM KE FRONTEND
        // =======================================================================
        const cleanData: Record<string, any> = {};
        
        if (parsedResult.data) {
          Object.keys(parsedResult.data).forEach((key) => {
            // Menghapus prefix 'penerima_' atau 'pengirim_' jika ada
            const cleanKey = key.replace(/^(penerima_|pengirim_)/, "");
            cleanData[cleanKey] = parsedResult.data[key];
          });
        }

        // Jalankan pemotongan kuota jika transaksi sukses
        if (session?.user?.id) {
          try {
            const { prisma } = await import("@/lib/prisma");
            await prisma.$executeRawUnsafe(`UPDATE "user" SET kuota = kuota - 1 WHERE id = $1 AND kuota > 0`, session.user.id);
          } catch {}
        }

        // Kembalikan data yang sudah bersih (Key kembali seperti config semula)
        return NextResponse.json({ 
          success: true, 
          extractedData: cleanData, 
          modelUsed: modelName 
        });
        
      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error; 
        console.warn(`⚠️ Model ${modelName} gagal. Error: ${error.message || error}`);
        continue; 
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error("Final Error Vision OCR:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses" }, { status: 500 });
  }
}