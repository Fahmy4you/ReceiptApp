import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt"; // 💡 IMPORT UNTUK DEKODE TOKEN HEADER FLUTTER/POSTMAN
import { getSettingByUserId, upsertSettingsAction } from "@/models/Settings";

// Helper function untuk mengambil userId secara fleksibel dari Cookie atau Header Bearer Token
async function getUserIdFromRequest(req: any): Promise<{ userId: string | undefined; userRole: string | undefined }> {
  // 1. Cek dari session cookie web bawaan Next-Auth
  if (req.auth?.user?.id) {
    return { 
      userId: req.auth.user.id, 
      userRole: (req.auth.user as any)?.role?.role || (req.auth.user as any)?.role?.id 
    };
  }

  // 2. Cek dari Authorization Header (Flutter / Postman)
  const authHeader = req.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (tokenFromHeader) {
    try {
      const decoded = await decode({
        token: tokenFromHeader,
        secret: process.env.AUTH_SECRET!,
        salt: "authjs.session-token",
      });

      if (decoded && decoded.sub) {
        // Ambil data role dari database untuk validasi admin via mobile app
        const userDb = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { roleId: true }
        });
        
        return { userId: decoded.sub, userRole: userDb?.roleId };
      }
    } catch (decodeError) {
      console.error("Gagal mendekode token di settings route:", decodeError);
    }
  }

  return { userId: undefined, userRole: undefined };
}

// =========================================================================
// 1. GET SETTINGS (MEMUAT KONFIGURASI TOKO)
// =========================================================================
export const GET = auth(async function GET(req) {
  const { userId, userRole } = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const isAdmin = userRole === "admin" || userRole === "cl-admin";
    const { searchParams } = new URL(req.url);
    
    // Jika admin menembak dari mobile, dia bisa oper ?userId=xxx (opsional)
    const targetUserId = isAdmin ? (searchParams.get("userId") || undefined) : undefined;

    // 💡 SINKRONISASI: Jika fungsi getSettingByUserId membutuhkan id user terkait saat req.auth null,
    // pastikan kamu mengoper userId hasil ekstrak token ini jika targetUserId kosong.
    const settings = await getSettingByUserId(targetUserId || userId);

    if (!settings) {
      return NextResponse.json({ 
        success: true, 
        message: "Pengaturan belum dikonfigurasi.", 
        data: null 
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Error pada GET Settings API:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat pengaturan" }, { status: 500 });
  }
});

// =========================================================================
// 2. POST UPSERT SETTINGS (SIMPAN/UPDATE KONFIGURASI TOKO)
// =========================================================================
export const POST = auth(async function POST(req) {
  const { userId } = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.data) {
      return NextResponse.json({ error: "Payload data pengaturan wajib diisi" }, { status: 400 });
    }

    // Panggil fungsi action bawaan milikmu yang sudah terintegrasi auto-delete file logo lama
    const result = await upsertSettingsAction({
      userId: body.userId || userId, // 💡 Force gunakan userId hasil ekstrak token jika bukan admin
      data: body.data, 
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Pengaturan toko berhasil disinkronkan!", 
      data: result.data 
    });
  } catch (error: any) {
    console.error("Error pada POST Settings API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
});