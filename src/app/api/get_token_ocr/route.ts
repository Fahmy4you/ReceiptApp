import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt"; // 💡 IMPORT UNTUK DEKODE TOKEN HEADER FLUTTER/POSTMAN

export const GET = auth(async function GET(req) {
  let userId: string | undefined = req.auth?.user?.id;

  // 💡 JIKA REQ.AUTH KOSONG, BERARTI REQUEST DATANG DARI MOBILE FLUTTER / POSTMAN VIA HEADER
  if (!userId) {
    const authHeader = req.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (tokenFromHeader) {
      try {
        // Dekode session JWT Next-Auth secara manual menggunakan secret server
        const decoded = await decode({
          token: tokenFromHeader,
          secret: process.env.AUTH_SECRET!,
          salt: "authjs.session-token", // Salt enkripsi bawaan Next-Auth v5
        });

        if (decoded && decoded.sub) {
          userId = decoded.sub; // sub berisi ID user riil dari database
        }
      } catch (decodeError) {
        console.error("Gagal mendekode token header di live kuota API:", decodeError);
      }
    }
  }

  // Jika lewat cookie web maupun header bearer tetep gak ketemu, baru lempar 401
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Token tidak valid." }, { status: 401 });
  }

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
    const licRows = await prisma.$queryRawUnsafe<Array<{ id: string, name: string }>>(
      `SELECT id, name FROM license WHERE id = $1 LIMIT 1`, 
      userRow.license_id
    );
    const licenseName = licRows?.[0]?.name || "Free Tier";
    const licenseId = licRows?.[0]?.id || "l-free-tier";

    // 4. Kembalikan data LIVE token/kuota terupdate
    return NextResponse.json({
      success: true,
      data: {
        userId: userId,
        kuota: userRow.kuota, // Ini sisa kuota OCR/scan live dari DB
        license: licenseName,  // Nama lisensi live (Free Tier / Premium)
        license_id: licenseId
      }
    });

  } catch (error: any) {
    console.error("Error pada GET Live Token API:", error);
    return NextResponse.json({ error: "Gagal mengambil data kuota terbaru" }, { status: 500 });
  }
});