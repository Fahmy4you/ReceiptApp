"use server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ROLES } from "@/lib/constanta";
import { getUserById } from "./User";
import { auth } from "@/lib/auth";

/**
 * Mendapatkan semua Layout
 * Admin: Bisa lihat semua. User: Hanya lihat miliknya.
 */
export const getAllLayouts = async (filters?: {
  userId?: string;
  sortBy?: keyof Prisma.LayoutOrderByWithRelationInput;
  order?: "asc" | "desc";
}) => {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  try {
    const layouts = await prisma.layout.findMany({
      where: {
        userId: isAdmin ? (filters?.userId || undefined) : session.user.id,
      },
      orderBy: {
        [filters?.sortBy || "createdAt"]: filters?.order || "desc",
      },
    });
    return layouts;
  } catch (error) {
    console.error("Error fetching layouts:", error);
    return [];
  }
};

/**
 * Mendapatkan Layout berdasarkan ID
 */
export const getLayoutById = async (id: string) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  try {
    const layout = await prisma.layout.findUnique({
      where: { id },
    });

    if (!layout) return null;

    // Proteksi: Bukan admin & bukan pemiliknya
    if (!isAdmin && layout.userId !== session.user.id) {
      return null;
    }

    return layout;
  } catch (error) {
    console.error("Error fetching layout by id:", error);
    return null;
  }
};

/**
 * Create Layout
 */
export const createLayout = async (data: {
  name: string;
  config: any;
  userId?: string;
  isDefault?: boolean;
}) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
  const targetUserId = isAdmin && data.userId ? data.userId : session.user.id;

  // Validasi user target ada
  const user = await getUserById(targetUserId);
  if (!user) throw new Error("User target tidak ditemukan");

  try {
    // Jika isDefault true, matikan default lain milik user ini dulu
    if (data.isDefault) {
      await prisma.layout.updateMany({
        where: { userId: targetUserId },
        data: { isDefault: false },
      });
    }

    const newLayout = await prisma.layout.create({
      data: {
        name: data.name,
        config: data.config,
        userId: targetUserId,
        isDefault: data.isDefault || false,
      },
    });

    return { success: true, data: newLayout };
  } catch (error) {
    console.error("Error creating layout:", error);
    return { success: false, error: "Gagal membuat layout" };
  }
};

/**
 * Update Layout
 */
export const updateLayout = async (id: string, data: {
  name?: string;
  config?: any;
  isDefault?: boolean;
  userId?: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  const existingLayout = await prisma.layout.findUnique({ where: { id } });
  if (!existingLayout) throw new Error("Layout tidak ditemukan");

  // Proteksi kepemilikan
  if (!isAdmin && existingLayout.userId !== session.user.id) {
    throw new Error("Forbidden: Akses ditolak");
  }

  const targetUserId = isAdmin && data.userId ? data.userId : existingLayout.userId;

  try {
    // Jika update menjadi default, matikan default lainnya
    if (data.isDefault) {
      await prisma.layout.updateMany({
        where: { userId: targetUserId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.layout.update({
      where: { id },
      data: {
        name: data.name,
        config: data.config,
        isDefault: data.isDefault,
        userId: isAdmin ? data.userId : undefined, // Hanya admin boleh pindah kepemilikan
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating layout:", error);
    return { success: false, error: "Gagal memperbarui layout" };
  }
};

/**
 * Delete Layout
 */
export const deleteLayout = async (id: string) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  const existingLayout = await prisma.layout.findUnique({ where: { id } });
  if (!existingLayout) throw new Error("Layout tidak ditemukan");

  if (!isAdmin && existingLayout.userId !== session.user.id) {
    throw new Error("Forbidden: Akses ditolak");
  }

  try {
    await prisma.layout.delete({ where: { id } });
    return { success: true, message: "Layout berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting layout:", error);
    return { success: false, error: "Gagal menghapus layout" };
  }
};