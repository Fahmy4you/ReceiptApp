import { auth } from "@/lib/auth";
import { deleteReceipt } from "@/models/Receipt";
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
      return decoded?.sub; // Mereturn userId (id user)
    } catch (decodeError) {
      console.error("Gagal mendekode token di receipts dynamic route:", decodeError);
    }
  }

  return undefined;
}

// =========================================================================
// DELETE RECEIPT BY ID (DARI WEB COOKIE MAUPUN MOBILE API HEADER)
// =========================================================================
export const DELETE = auth(async function DELETE(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(req);

  // Jika lewat cookie maupun header tetap tidak ketemu session-nya
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID Receipt tidak ditemukan pada request URL" }, { status: 400 });
    }

    // 💡 SINKRONISASI: Jika fungsi deleteReceipt di model kamu membutuhkan userId tambahan 
    // karena req.auth kosong, kamu bisa oper userId-nya ke sini (contoh: deleteReceipt(id, userId)).
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
    
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: error.message || "Gagal menghapus data" }, { status: 500 });
  }
});