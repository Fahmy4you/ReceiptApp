import { auth } from "@/lib/auth";
import { deleteLayout, getLayoutById, updateLayout } from "@/models/Layout";
import { decode } from "next-auth/jwt"; // 💡 IMPORT UNTUK DEKODE TOKEN HEADER FLUTTER/POSTMAN
import { NextResponse } from "next/server";

// Helper function untuk mengambil userId secara fleksibel dari Cookie atau Header Bearer Token
async function getUserIdFromRequest(req: any): Promise<string | undefined> {
  // 1. Cek dari session cookie web bawaan Next-Auth
  if (req.auth?.user?.id) {
    return req.auth.user.id;
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
      return decoded?.sub; // Mereturn userId
    } catch (decodeError) {
      console.error("Gagal mendekode token di dynamic route:", decodeError);
    }
  }

  return undefined;
}

// =========================================================================
// 1. GET DETAIL LAYOUT BY ID
// =========================================================================
export const GET = auth(async function GET(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // 💡 SINKRONISASI: Jika fungsi modelmu membutuhkan userId tambahan karena req.auth kosong, 
    // kamu bisa oper userId-nya ke argumen fungsi (sesuaikan dengan isi models/Layout.ts kamu).
    const layout = await getLayoutById(id);

    if (!layout) {
      return NextResponse.json({ error: "Forbidden atau Layout tidak ditemukan" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: layout });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat detail layout" }, { status: 500 });
  }
});

// =========================================================================
// 2. PUT UPDATE LAYOUT BY ID
// =========================================================================
export const PUT = auth(async function PUT(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Jalankan fungsi updateLayout bawaan milikmu.
    const result = await updateLayout(id, {
      name: body.name,
      config: body.config,
      isDefault: body.isDefault,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Error pada PUT Layout API:", error);
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Gagal memperbarui layout" }, { status: 500 });
  }
});

// =========================================================================
// 3. DELETE LAYOUT BY ID
// =========================================================================
export const DELETE = auth(async function DELETE(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Fungsi deleteLayout milikmu otomatis mengecek kepemilikan sebelum menghapus baris di Prisma
    const result = await deleteLayout(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Error pada DELETE Layout API:", error);
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Gagal menghapus layout" }, { status: 500 });
  }
});