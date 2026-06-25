import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt"; // 💡 IMPORT UNTUK DEKODE TOKEN HEADER FLUTTER/POSTMAN
import { getLayoutById } from "@/models/Layout";
import { createReceipt } from "@/models/Receipt";

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
        // Ambil data role dari database untuk validasi admin mobile app
        const userDb = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { roleId: true }
        });
        
        return { userId: decoded.sub, userRole: userDb?.roleId };
      }
    } catch (decodeError) {
      console.error("Gagal mendekode token di receipts route:", decodeError);
    }
  }

  return { userId: undefined, userRole: undefined };
}

// =========================================================================
// 1. GET ALL RECEIPTS (HISTORY STRUK)
// =========================================================================
export const GET = auth(async function GET(req) {
  const { userId, userRole } = await getUserIdFromRequest(req);

  // Jika lewat cookie maupun header tetap tidak ketemu session-nya
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const startStr = searchParams.get("startDate");
    const endStr = searchParams.get("endDate");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    let startDateCreatedAt: Date | undefined = undefined;
    let endDateCreatedAt: Date | undefined = undefined;

    if (startStr && endStr) {
      startDateCreatedAt = new Date(startStr);
      endDateCreatedAt = new Date(`${endStr}T23:59:59.999Z`);
    }

    const isAdmin = userRole === "admin" || userRole === "cl-admin";

    const receipts = await prisma.receipt.findMany({
      where: {
        userId: isAdmin ? (searchParams.get("userId") || undefined) : userId, // 💡 Gunakan userId hasil ekstrak token
        
        ...(search && {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        }),

        ...(type && {
          type: type as any,
        }),

        ...(startDateCreatedAt && endDateCreatedAt && {
          createdAt: {
            gte: startDateCreatedAt,
            lte: endDateCreatedAt,
          },
        }),
      },
      include: {
        layout: true,
      },
      orderBy: {
        createdAt: order,
      },
      take: limit || undefined,
    });

    return NextResponse.json({ success: true, data: receipts });
  } catch (error: any) {
    console.error("Error pada GET Receipts API:", error);
    return NextResponse.json({ error: error.message || "Gagal mengambil data history" }, { status: 500 });
  }
});

// =========================================================================
// 2. POST CREATE RECEIPT (SIMPAN STRUK BARU)
// =========================================================================
export const POST = auth(async function POST(req) {
  const { userId } = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Session tidak ditemukan." }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.nama || !body.type || !body.content) {
      return NextResponse.json({ error: "Parameter nama, type, dan content wajib diisi" }, { status: 400 });
    }

    if (body.layoutId) {
      const existingLayout = await getLayoutById(body.layoutId);

      if (!existingLayout) {
        return NextResponse.json({ 
          error: "Forbidden: Layout tidak valid atau Anda tidak memiliki hak akses ke layout ini!" 
        }, { status: 403 });
      }
    }

    // Jalankan simpan data jika pengecekan di atas lolos semua
    const result = await createReceipt({
      nama: body.nama,
      layoutId: body.layoutId || null,
      total: body.total ? parseFloat(body.total) : null,
      content: body.content,
      type: body.type,
      // userId dilempar manual ke fungsi agar data terkunci aman di level db internal milik user terkait
      userId: userId, 
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
});