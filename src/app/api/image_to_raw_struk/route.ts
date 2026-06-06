import { GoogleGenAI, Type } from "@google/genai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('device_fingerprint')?.value;

    if (!deviceId) {
      return NextResponse.json({ error: "ID Perangkat tidak ditemukan" }, { status: 400 });
    }

    const session = await auth();
    if (session?.user?.id) {
      const rows = await (await import("@/lib/prisma")).prisma.$queryRawUnsafe<Array<{ kuota: number }>>(
        `SELECT kuota FROM "user" WHERE id = $1 LIMIT 1`, session.user.id
      );
      const userKuota = rows?.[0]?.kuota ?? 0;
      if (userKuota <= 0) {
        return NextResponse.json({ error: "Kuota OCR habis. Isi ulang kuota untuk melanjutkan." }, { status: 403 });
      }
    }
    
    const { imageBase64, mimeType, targetFields } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Gambar kosong" }, { status: 400 });

    // 1. Bangun properti objek dinamis untuk skema ekstraksi data
    const propertiesSchema: Record<string, any> = {};
    targetFields.forEach((field: any) => {
      propertiesSchema[field.key] = {
        type: Type.STRING,
        description: `Nilai dari elemen ${field.label} yang tertera di struk. Jika benar-benar tidak ada di gambar, isi wajib dengan string "null".`,
      };
    });

    // 2. Tentukan Skema Output yang Sangat Ketat Menggunakan responseSchema
    // Ini memaksa Gemini memilih antara mengembalikan objek 'data' atau 'error_layout'
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        is_layout_sesuai: {
          type: Type.BOOLEAN,
          description: "Berikan nilai false JIKA gambar yang dikirim adalah nota manual/tulisan tangan/e-wallet yang struknya tidak sesuai dengan targetFields yang diminta. Berikan true jika jenis struk sesuai.",
        },
        error_layout: {
          type: Type.STRING,
          description: "Wajib diisi dengan 'Gambar tidak sesuai dengan permintaan layout, buat layout baru' HANYA JIKA is_layout_sesuai bernilai false. Jika true, kosongkan saja atau beri string kosong.",
        },
        data: {
          type: Type.OBJECT,
          description: "Hasil ekstraksi data struk. Jika is_layout_sesuai bernilai false, biarkan objek ini kosong atau null.",
          properties: propertiesSchema,
        }
      },
      required: ["is_layout_sesuai", "error_layout"],
    };

    // 3. Susun instruksi sejelas mungkin tanpa membingungkan AI
    const prompt = `Tugas Anda adalah memvalidasi dan mengekstrak data dari gambar bukti transfer / struk yang diberikan.
                    Langkah Kerja Wajib:
                    1. Periksa konten gambar. Gambar dapat berupa: resi m-banking resmi, struk thermal fisik, ATAU screenshot teks chat/pesan (seperti WhatsApp/Telegram) yang berisi rincian transfer manual yang valid. 
                    2. Klasifikasikan sebagai layout TIDAK SESUAI (is_layout_sesuai: false) HANYA JIKA gambar tersebut benar-benar tidak mengandung informasi transfer sama sekali (misal: foto pemandangan, nota belanja barang kelontong/indomaret, atau foto selfie). Jika ada teks Bank, Nominal, dan Nama Penerima (meskipun di dalam chat), set is_layout_sesuai: true.
                    3. Jika layout TIDAK SESUAI, isi properti 'error_layout' dengan persis: "Gambar tidak sesuai dengan permintaan layout, buat layout baru".
                    4. Jika layout SESUAI, lakukan ekstraksi bidang berikut ke dalam objek 'data':
                    ${JSON.stringify(targetFields.map((f: any) => `${f.key} (${f.label})`), null, 2)}

                    Catatan Pengolahan Nilai (WAJIB DIPATUHI):
                    - Format Tanggal: Wajib "DD MMM YYYY" (Contoh: "23 Des 2023" atau "04 Jun 2026").
                    - Bersihkan spasi dan tanda minus (-) pada No.HP atau No.Rekening.
                    - Jika nomor referensi tidak ditemukan, isi dengan string acak 10 karakter alfanumerik.

                    ⚠️ ATURAN KETAT UNTUK NOMINAL / ANGKA ANGURAN:
                    - Hati-hati dengan nominal uang! Periksa baik-baik posisi titik (.) dan koma (,).
                    - Jika ada angka desimal di akhir seperti ",00" atau ".00" (sen), ABAIKAN dan JANGAN masukkan ke dalam angka utama. 
                    - Contoh: "14,500,000.00" atau "14.500.000.00" atau "Rp 1.450.000.000 (jika 3 nol terakhir adalah sen)" HARUS diekstrak menjadi "14500000" (Empat Belas Juta Lima Ratus Ribu).
                    - Pastikan hasil akhir nominal HANYA BERUPA ANGKA MURNI tanpa simbol mata uang (jangan ada Rp, IDR) dan sesuaikan dengan nilai riil transfernya (bukan nilai sen).`;

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
      "gemini-2.5-flash-lite-preview"
    ];

    let lastError;

    for (const modelName of availableModels) {
      try {
        console.log(`Mencoba model dengan Schema: ${modelName}`);
        
        const result = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          }
        });

        // 1. Jika response kosong, lemparkan error agar ditangkap oleh catch internal loop ini
        if (!result || !result.text) {
          throw new Error(`Response dari ${modelName} tidak valid atau kosong`);
        }
        
        const parsedResult = JSON.parse(result.text);

        // 4. Intersepsi di Backend: Jika AI mendeteksi layout tidak cocok
        if (parsedResult.is_layout_sesuai === false || parsedResult.error_layout) {
          return NextResponse.json({ 
            success: false,
            error: parsedResult.error_layout || "Gambar tidak sesuai dengan permintaan layout, buat layout baru"
          });
        }

        if (session?.user?.id) {
          try {
            const { prisma } = await import("@/lib/prisma");
            await prisma.$executeRawUnsafe(`UPDATE "user" SET kuota = kuota - 1 WHERE id = $1 AND kuota > 0`, session.user.id);
          } catch {}
        }

        // Jika berhasil sampai sini, langsung return dan hentikan fungsi (berhasil)
        return NextResponse.json({ 
          success: true, 
          extractedData: parsedResult.data, 
          modelUsed: modelName 
        });
        
      } catch (error: any) {
        // Simpan error terakhir untuk dilacak jika semua model gagal
        lastError = error; 
        
        // Tampilkan log error di server agar kamu tahu model mana yang bermasalah dan kenapa
        console.warn(`⚠️ Model ${modelName} gagal memproses. Error: ${error.message || error}`);
        
        // PENTING: Jangan di-throw! Gunakan continue agar looping tetap berjalan ke model berikutnya
        continue; 
      }
    }

    // Jika kode sampai ke titik ini, artinya seluruh model di dalam array `availableModels` telah dicoba dan SEMUANYA GAGAL
    throw lastError;

    throw lastError;

  } catch (error: any) {
    console.error("Final Error Vision:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses" }, { status: 500 });
  }
}