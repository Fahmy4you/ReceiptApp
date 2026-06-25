import { auth, getUserIdFromRequest } from "@/lib/auth";
import { deleteReceipt } from "@/models/Receipt";
import { NextResponse } from "next/server";

// =========================================================================
// DELETE RECEIPT BY ID (DARI WEB COOKIE MAUPUN MOBILE API HEADER)
// =========================================================================
export const DELETE = auth(async function DELETE(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Ekstrak userId dan userRole menggunakan helper andalanmu
  const { userId, userRole } = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Silakan login terlebih dahulu." }, 
      { status: 401 }
    );
  }

  try {
    const { id } = await params; // Ambil ID receipt dari dynamic route [id]

    // 2. Panggil action deleteReceipt dengan menyuntikkan (inject) data user ke parameter kedua
    const result = await deleteReceipt(id, {
      id: userId,
      roleId: userRole || "",
      roleName: userRole || "",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error pada DELETE Receipt API:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus data riwayat" }, 
      { status: 500 }
    );
  }
});