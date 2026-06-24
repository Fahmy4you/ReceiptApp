import { auth } from "@/lib/auth";
import { getSettingByUserId, upsertSettingsAction } from "@/models/Settings";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const isAdmin = req.auth.user.role.role === "admin" || req.auth.user.role.id === "cl-admin";
    const { searchParams } = new URL(req.url);
    
    // Jika admin menembak dari mobile, dia bisa oper ?userId=xxx (opsional)
    const targetUserId = isAdmin ? (searchParams.get("userId") || undefined) : undefined;

    // Fungsi getSettingByUserId asli kamu otomatis maksa pake id sendiri kalau bukan admin
    const settings = await getSettingByUserId(targetUserId);

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


export const POST = auth(async function POST(req) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.data) {
      return NextResponse.json({ error: "Payload data pengaturan wajib diisi" }, { status: 400 });
    }

    // Panggil fungsi action bawaan milikmu yang sudah terintegrasi auto-delete file logo lama
    const result = await upsertSettingsAction({
      userId: body.userId || undefined, // Hanya berefek jika yang request adalah Admin
      data: body.data, // Berupa object JSON konfigurasi setting toko
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