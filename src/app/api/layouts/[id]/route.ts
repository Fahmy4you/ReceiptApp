import { auth, getUserIdFromRequest } from "@/lib/auth";
import { deleteLayout, getLayoutById, updateLayout } from "@/models/Layout";
import { NextResponse } from "next/server";

// =========================================================================
// 1. GET DETAIL LAYOUT BY ID
// =========================================================================
export const GET = auth(async function GET(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getUserIdFromRequest(req);

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
  const { userId } = await getUserIdFromRequest(req);

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
  // 💡 Ambil userId dan userRole dari request header/cookie global helper
  const { userId, userRole } = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 💡 SINKRONISASI: Kirim payload data auth sebagai parameter kedua ke action
    const result = await deleteLayout(id, {
      id: userId,
      roleId: userRole || "",
      roleName: userRole || ""
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Error pada DELETE Layout API:", error);
    
    // Deteksi jika error dilempar karena masalah hak akses ownership (Forbidden)
    if (error.message?.includes("Forbidden") || error.message?.includes("ditolak")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || "Gagal menghapus layout" }, { status: 500 });
  }
});