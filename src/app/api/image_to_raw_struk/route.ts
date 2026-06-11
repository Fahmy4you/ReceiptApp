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

    const propertiesSchema: Record<string, any> = {};
    targetFields.forEach((field: any) => {
      propertiesSchema[field.key] = {
        type: Type.STRING,
        description: `Nilai dari elemen ${field.label} yang tertera di struk. Jika benar-benar tidak ada di gambar, isi wajib dengan string "null".`,
      };
    });

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

    const prompt = `Tugas Anda adalah memvalidasi dan mengekstrak data dari gambar bukti transfer / struk yang diberikan... (Instruksi disingkat agar ringkas)`;

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
      // 🛠️ 1. BUAT ABORT CONTROLLER UNTUK TIMEOUT PAKSA
      const controller = new AbortController();
      // Set batas toleransi nunggu. 
      // Jika lewat 15 detik model gak ngerespon, batalkan otomatis.
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15000ms = 15 detik

      try {
        console.log(`Mencoba model dengan Schema: ${modelName}`);
        
        const result = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            abortSignal: controller.signal
          }
        });

        // Hapus timeout jika request berhasil sebelum 5 detik
        clearTimeout(timeoutId);

        if (!result || !result.text) {
          throw new Error(`Response dari ${modelName} tidak valid atau kosong`);
        }
        
        const parsedResult = JSON.parse(result.text);

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

        return NextResponse.json({ 
          success: true, 
          extractedData: parsedResult.data, 
          modelUsed: modelName 
        });
        
      } catch (error: any) {
        // Hapus timeout jika masuk ke block catch sebelum 5 detik
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          console.warn(`⏱️ Model ${modelName} memakan waktu terlalu lama (Timeout)! Langsung skip.`);
          lastError = new Error(`Model ${modelName} hang/timeout.`);
        } else {
          lastError = error; 
          console.warn(`⚠️ Model ${modelName} gagal memproses. Error: ${error.message || error}`);
        }
        
        continue; 
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error("Final Error Vision:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses" }, { status: 500 });
  }
}