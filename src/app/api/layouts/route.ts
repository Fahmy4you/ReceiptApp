import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createLayout } from "@/models/Layout";

// =========================================================================
// 1. GET ALL LAYOUTS (DENGAN SEARCH NAMA & FILTER COCOK UNTUK FLUTTER)
// =========================================================================
export const GET = auth(async function GET(req) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const sortBy = (searchParams.get("sortBy") as any) || "createdAt";

    const isAdmin = req.auth.user.role.role === "admin" || req.auth.user.role.id === "cl-admin";

    // Kita gunakan prisma.findMany langsung agar bisa fleksibel handle search text sensitif
    const layouts = await prisma.layout.findMany({
      where: {
        // Keamanan dasar: Admin bisa lihat siapa saja, user biasa dikunci ke ID-nya sendiri
        userId: isAdmin ? (searchParams.get("userId") || undefined) : req.auth.user.id,
        
        // Fitur SEARCH berdasarkan nama layout (misal: "STRUK TOKEN")
        ...(search && {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
      orderBy: {
        [sortBy]: order,
      },
    });

    return NextResponse.json({ success: true, data: layouts });
  } catch (error: any) {
    console.error("Error pada GET Layouts API:", error);
    return NextResponse.json({ error: error.message || "Gagal mengambil data layout" }, { status: 500 });
  }
});

// =========================================================================
// 2. POST CREATE LAYOUT (MEMBUAT TEMPLATE STRUK BARU)
// =========================================================================
export const POST = auth(async function POST(req) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.name || !body.config) {
      return NextResponse.json({ error: "Parameter name dan config wajib diisi" }, { status: 400 });
    }

    // Panggil fungsi createLayout bawaan milikmu (otomatis handle reset isDefault ke false untuk layout lain)
    const result = await createLayout({
      name: body.name,
      config: body.config,
      isDefault: body.isDefault || false,
      // userId otomatis diarahkan ke session.user.id di dalam fungsi kamu jika bukan admin
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Error pada POST Layout API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
});