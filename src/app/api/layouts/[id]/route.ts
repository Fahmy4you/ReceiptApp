import { auth } from "@/lib/auth";
import { deleteLayout, getLayoutById, updateLayout } from "@/models/Layout";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // Fungsi getLayoutById milikmu otomatis mereturn null jika bukan milik user yang login / bukan admin
    const layout = await getLayoutById(id);

    if (!layout) {
      return NextResponse.json({ error: "Forbidden atau Layout tidak ditemukan" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: layout });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memuat detail layout" }, { status: 500 });
  }
});

export const PUT = auth(async function PUT(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Jalankan fungsi updateLayout bawaan milikmu.
    // Di dalamnya sudah aman terkunci validasi existingLayout.userId !== session.user.id
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

export const DELETE = auth(async function DELETE(
  req,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!req.auth || !req.auth.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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