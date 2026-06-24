import { auth } from "@/lib/auth";
import { deleteReceipt } from "@/models/Receipt";
import { NextResponse } from "next/server";

export const DELETE = auth(async function DELETE(
  req,
  { params }: { params: Promise<{ id: string }> } // Mengikuti standar Next.js 15 App Router (Promise params)
) {
  // 1. Validasi Autentikasi Utama
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    // 2. Ambil ID dari dynamic route parameter URL ([id])
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID Receipt tidak ditemukan pada request URL" }, { status: 400 });
    }

    // 3. Panggil fungsi deleteReceipt bawaan milikmu
    // Pengecekan kepemilikan (existingReceipt.userId !== session.user.id) otomatis diproses di dalamnya.
    // Jika user mencoba menghapus struk orang lain, internal fungsi kamu akan melempar (throw) Error "Forbidden".
    const result = await deleteReceipt(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message || "Data history transaksi berhasil dihapus secara permanen." 
    });

  } catch (error: any) {
    console.error("Error pada DELETE Receipt API:", error);
    
    // Tangkap error "Forbidden" dari Server Action kamu dan ubah response status menjadi 403
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || "Gagal menghapus data" }, { status: 500 });
  }
});