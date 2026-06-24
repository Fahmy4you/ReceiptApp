import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLayoutById } from "@/models/Layout";
import { createReceipt } from "@/models/Receipt";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  // 1. Cek Autentikasi Session
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const startStr = searchParams.get("startDate");
    const endStr = searchParams.get("endDate");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // 2. Inisialisasi filter tanggal (default undefined agar tidak memfilter kalau kosong)
    let startDateCreatedAt: Date | undefined = undefined;
    let endDateCreatedAt: Date | undefined = undefined;

    // KUNCI AMAN: Hanya aktifkan filter rentang tanggal JIKA KEDUA PARAMETER DIISI dari Flutter
    if (startStr && endStr) {
      startDateCreatedAt = new Date(startStr);
      endDateCreatedAt = new Date(`${endStr}T23:59:59.999Z`); // Sampai akhir hari tersebut
    }

    const isAdmin = req.auth.user.role.role === "admin" || req.auth.user.role.id === "cl-admin";

    // 3. Tarik data dari database via Prisma findMany
    const receipts = await prisma.receipt.findMany({
      where: {
        // Hak akses dasar: Admin bisa filter userId mana saja, User biasa dipaksa kunci ID-nya sendiri
        userId: isAdmin ? (searchParams.get("userId") || undefined) : req.auth.user.id,
        
        ...(search && {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        }),

        // Filter Tipe Struk (Jika ada)
        ...(type && {
          type: type as any,
        }),

        // Filter Tanggal (Otomatis dilewati dan ambil SEMUA data jika startDate/endDate kosong)
        ...(startDateCreatedAt && endDateCreatedAt && {
          createdAt: {
            gte: startDateCreatedAt,
            lte: endDateCreatedAt,
          },
        }),
      },
      include: {
        layout: true, // Ambil data joinan konfigurasi layout struknya
      },
      orderBy: {
        createdAt: order,
      },
      take: limit || undefined, // Batasi jumlah baris data (jika ada limit dari Flutter)
    });

    return NextResponse.json({ success: true, data: receipts });
  } catch (error: any) {
    console.error("Error pada GET Receipts API:", error);
    return NextResponse.json({ error: error.message || "Gagal mengambil data history" }, { status: 500 });
  }
});

export const POST = auth(async function POST(req) {
  // 1. Validasi Auth Utama dari Next-Auth Session
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Session tidak ditemukan." }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 2. Validasi kelengkapan parameter mentah dari Flutter
    if (!body.nama || !body.type || !body.content) {
      return NextResponse.json({ error: "Parameter nama, type, dan content wajib diisi" }, { status: 400 });
    }

    // 3. KUNCI KEAMANAN VALIDAISI LAYOUT (Solusi dari kefatalan kemarin)
    if (body.layoutId) {
      // Panggil fungsi dapatkan layout dari service milikmu
      const existingLayout = await getLayoutById(body.layoutId);

      // Jika layout tidak ditemukan atau mengembalikan null (karena diblokir hak aksesnya oleh getLayoutById)
      if (!existingLayout) {
        return NextResponse.json({ 
          error: "Forbidden: Layout tidak valid atau Anda tidak memiliki hak akses ke layout ini!" 
        }, { status: 403 });
      }
    }

    // 4. Jalankan simpan data jika pengecekan di atas lolos semua
    const result = await createReceipt({
      nama: body.nama,
      layoutId: body.layoutId || null,
      total: body.total ? parseFloat(body.total) : null,
      content: body.content,
      type: body.type,
      // userId opsional untuk admin, tapi bagi user biasa otomatis dipaksa pakai id miliknya di internal fungsi kamu
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
});