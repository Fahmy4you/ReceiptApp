import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt"; // 💡 IMPORT UNTUK DEKODE TOKEN HEADER FLUTTER/POSTMAN
import { createLayout } from "@/models/Layout";

// =========================================================================
// 1. GET ALL LAYOUTS (SUPPORT COOKIE WEB & HEADER BEARER MOBILE)
// =========================================================================
export const GET = auth(async function GET(req) {
  let userId: string | undefined = req.auth?.user?.id;
  let userRole: string | undefined = (req.auth?.user as any)?.role?.role || (req.auth?.user as any)?.role?.id;

  // 💡 JIKA REQ.AUTH KOSONG, BERARTI REQUEST DATANG DARI FLUTTER / POSTMAN VIA HEADER
  if (!userId) {
    const authHeader = req.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (tokenFromHeader) {
      try {
        // Dekode session JWT Next-Auth secara manual menggunakan secret server
        const decoded = await decode({
          token: tokenFromHeader,
          secret: process.env.AUTH_SECRET!,
          salt: "authjs.session-token", // Salt enkripsi bawaan Next-Auth v5
        });

        if (decoded && decoded.sub) {
          userId = decoded.sub; // sub berisi userRow.id yang kita inject kemarin
          
          // Ambil data role dari DB berdasarkan userId untuk keperluan pengecekan admin
          const userDb = await prisma.user.findUnique({
            where: { id: userId },
            select: { roleId: true }
          });
          userRole = userDb?.roleId; 
        }
      } catch (decodeError) {
        console.error("Gagal mendekode token header:", decodeError);
      }
    }
  }

  // Cek validasi akhir, jika lewat cookie maupun header tetep ga ketemu, baru lempar 401
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const sortBy = (searchParams.get("sortBy") as any) || "createdAt";

    // Validasi apakah dia admin (mendukung string role_id maupun object role bawaanmu)
    const isAdmin = userRole === "admin" || userRole === "cl-admin";

    const layouts = await prisma.layout.findMany({
      where: {
        userId: isAdmin ? (searchParams.get("userId") || undefined) : userId,
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
// 2. POST CREATE LAYOUT
// =========================================================================
export const POST = auth(async function POST(req) {
  let userId: string | undefined = req.auth?.user?.id;

  // Sinkronisasi token untuk request POST (sama seperti GET di atas)
  if (!userId) {
    const authHeader = req.headers.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (tokenFromHeader) {
      try {
        const decoded = await decode({
          token: tokenFromHeader,
          secret: process.env.AUTH_SECRET!,
          salt: "authjs.session-token",
        });
        userId = decoded?.sub;
      } catch (_) {}
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.name || !body.config) {
      return NextResponse.json({ error: "Parameter name dan config wajib diisi" }, { status: 400 });
    }

    const result = await createLayout({
      name: body.name,
      config: body.config,
      isDefault: body.isDefault || false,
      userId: userId, // Oper userId yang valid ke model
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