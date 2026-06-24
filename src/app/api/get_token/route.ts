import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const GET = auth(async function GET(req) {
  // 1. Cek Autentikasi Session dari Flutter Header
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Token tidak valid." }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    // 2. Ambil data kuota paling segar langsung dari database (Gunakan Raw SQL sesuai style-mu)
    const rows = await prisma.$queryRawUnsafe<Array<{ kuota: number; license_id: string }>>(
      `SELECT u.kuota, u.license_id FROM "user" u WHERE u.id = $1 LIMIT 1`,
      userId
    );

    const userRow = rows?.[0];

    if (!userRow) {
      return NextResponse.json({ error: "User tidak ditemukan di database" }, { status: 404 });
    }

    // 3. Tarik nama lisensinya juga buat jaga-jaga kalau dia upgrade tier (Biar ikut update di Flutter)
    const licRows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM license WHERE id = $1 LIMIT 1`, 
      userRow.license_id
    );
    const licenseName = licRows?.[0]?.name || "Free Tier";

    // 4. Kembalikan data LIVE token/kuota terupdate
    return NextResponse.json({
      success: true,
      data: {
        userId: userId,
        kuota: userRow.kuota, // Ini sisa kuota OCR/scan live dari DB
        license: licenseName  // Nama lisensi live (Free Tier / Premium)
      }
    });

  } catch (error: any) {
    console.error("Error pada GET Live Token API:", error);
    return NextResponse.json({ error: "Gagal mengambil data kuota terbaru" }, { status: 500 });
  }
});