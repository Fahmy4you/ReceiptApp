import { NextResponse } from "next/server";
import { auth, getUserIdFromRequest } from "@/lib/auth";
import { getSettingByUserId, upsertSettingsAction } from "@/models/Settings";

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
    const targetUserId = isAdmin ? (searchParams.get("userId") || undefined) : undefined;

    // 💡 OPER DATA AUTH LANGSUNG KE MODEL SEBAGAI INJEKSI PARAMETER KEDUA
    const settings = await getSettingByUserId(targetUserId, {
      id: userId,
      roleId: userRole || "",
      roleName: userRole || "" // Menyesuaikan dengan validasi string di model kamu
    });

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
  // 💡 Gunakan helper yang sama agar validasi token mobile seragam
  const { userId, userRole } = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.data) {
      return NextResponse.json({ error: "Payload data pengaturan wajib diisi" }, { status: 400 });
    }

    const isAdmin = userRole === "admin" || userRole === "cl-admin";
    const targetUserId = isAdmin ? (body.userId || userId) : userId;

    // 💡 SUNTIKKAN OVERRIDE USER SAMA SEPERTI DI GET NYA
    const result = await upsertSettingsAction({
      userId: targetUserId, 
      data: body.data, 
    }, {
      id: userId,
      roleId: userRole || "",
      roleName: userRole || ""
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