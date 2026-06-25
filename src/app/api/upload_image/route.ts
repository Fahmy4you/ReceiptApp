import { NextResponse } from "next/server";
import { writeFile, mkdir, chmod } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth"; // 💡 IMPORT AUTH NEXT-AUTH
import { decode } from "next-auth/jwt"; // 💡 IMPORT UNTUK DEKODE TOKEN HEADER FLUTTER
import { CONFIG_UPLOAD_IMAGES } from "@/lib/constanta";

// =========================================================================
// POST UPLOAD IMAGE (BASE64 SUPPORT COOKIE WEB & HEADER BEARER MOBILE)
// =========================================================================
export const POST = auth(async function POST(request: Request) {
  let userId: string | undefined = (request as any).auth?.user?.id;

  // 💡 JIKA REQUEST DATANG DARI FLUTTER, EXTRAK USERID DARI HEADER BEARER
  if (!userId) {
    const authHeader = request.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (tokenFromHeader) {
      try {
        const decoded = await decode({
          token: tokenFromHeader,
          secret: process.env.AUTH_SECRET!,
          salt: "authjs.session-token",
        });
        userId = decoded?.sub; // Dapatkan userId riil dari token mobile
      } catch (decodeError) {
        console.error("Gagal mendekode token di upload API:", decodeError);
      }
    }
  }

  // Pengaman: Jika tidak login dari web maupun mobile, dilarang keras upload file
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    // 2. Ambil data dari JSON (Base64)
    const { base64, category } = await request.json();

    if (!base64) {
      return NextResponse.json({ error: "Payload file Base64 kosong!" }, { status: 400 });
    }

    // 3. Validasi: Apakah kategori terdaftar di config?
    if (!category || !CONFIG_UPLOAD_IMAGES[category as keyof typeof CONFIG_UPLOAD_IMAGES]) {
      return NextResponse.json({ error: "Kategori ilegal!" }, { status: 400 });
    }

    const targetConfig = CONFIG_UPLOAD_IMAGES[category as keyof typeof CONFIG_UPLOAD_IMAGES];

    // 4. Ekstrak info dari Base64
    const mimeType = base64.match(/data:(.*?);base64/)?.[1];
    const base64Data = base64.split(",")[1];
    
    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: "Format Base64 tidak valid!" }, { status: 400 });
    }

    const buffer = Buffer.from(base64Data, "base64");

    // 5. Validasi Tipe File & Ukuran
    if (!targetConfig.allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: "Format file tidak diizinkan!" }, { status: 400 });
    }

    if (buffer.length > targetConfig.maxSize) {
      return NextResponse.json({ error: "File terlalu besar!" }, { status: 400 });
    }

    // 6. Tentukan Path & Simpan
    const relativePath = `/image/upload/${targetConfig.folder}`;
    const uploadDir = path.join(process.cwd(), "public", relativePath);

    await mkdir(uploadDir, { recursive: true });

    // Cari ekstensi file asli (misal: 'jpeg', 'png', dll)
    const extension = mimeType.split("/")[1];
    
    // Nama file: timestamp-userid.ext (Sekarang aman karena userId sudah terdefinisi resmi)
    const finalFileName = `${Date.now()}-${userId}.${extension}`;
    const filePath = path.join(uploadDir, finalFileName);

    await writeFile(filePath, buffer);
    await chmod(filePath, 0o644); // Atur read-write permission agar bisa diakses publik browser

    return NextResponse.json({ 
      success: true,
      path: `${relativePath}/${finalFileName}`,
      message: "File berhasil disimpan"
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Gagal memproses unggahan" }, { status: 500 });
  }
});