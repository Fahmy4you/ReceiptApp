"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getDeviceIdentifier } from "@/lib/getDeviceIdentifier"; // Import helper global kamu

/**
 * Mendapatkan semua Layout milik perangkat saat ini
 */
export const getAllLayouts = async (filters?: {
  sortBy?: keyof Prisma.LayoutOrderByWithRelationInput;
  order?: "asc" | "desc";
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const layouts = await prisma.layout.findMany({
      where: {
        userId: deviceId, // Hanya mengambil layout yang dicatat oleh perangkat ini
      },
      orderBy: {
        [filters?.sortBy || "createdAt"]: filters?.order || "desc",
      },
    });
    return layouts;
  } catch (error: any) {
    console.error("Error fetching layouts:", error.message);
    return [];
  }
};

/**
 * Mendapatkan Layout spesifik berdasarkan ID
 */
export const getLayoutById = async (id: string) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const layout = await prisma.layout.findUnique({
      where: { id },
    });

    if (!layout) return null;

    // Proteksi: Mencegah perangkat lain mengintip layout lewat manipulasi ID di URL
    if (layout.userId !== deviceId) {
      return null;
    }

    return layout;
  } catch (error) {
    console.error("Error fetching layout by id:", error);
    return null;
  }
};

/**
 * Membuat Layout Baru
 */
export const createLayout = async (data: {
  name: string;
  config: any;
  isDefault?: boolean;
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    // Jika layout baru diset sebagai default, matikan status default layout lama milik perangkat ini
    if (data.isDefault) {
      await prisma.layout.updateMany({
        where: { userId: deviceId },
        data: { isDefault: false },
      });
    }

    const newLayout = await prisma.layout.create({
      data: {
        name: data.name,
        config: data.config,
        userId: deviceId, // Pemiliknya dikunci ke ID perangkat saat ini
        isDefault: data.isDefault || false,
      },
    });

    return { success: true, data: newLayout };
  } catch (error: any) {
    console.error("Error creating layout:", error.message);
    return { success: false, error: "Gagal membuat layout" };
  }
};

/**
 * Memperbarui Layout
 */
export const updateLayout = async (id: string, data: {
  name?: string;
  config?: any;
  isDefault?: boolean;
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const existingLayout = await prisma.layout.findUnique({ where: { id } });
    if (!existingLayout) throw new Error("Layout tidak ditemukan");

    // Proteksi kepemilikan: Hanya perangkat pembuat yang boleh mengedit
    if (existingLayout.userId !== deviceId) {
      throw new Error("Forbidden: Anda tidak memiliki akses untuk mengubah layout ini");
    }

    // Jika update merubah layout ini menjadi default, matikan default lainnya
    if (data.isDefault) {
      await prisma.layout.updateMany({
        where: { userId: deviceId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.layout.update({
      where: { id },
      data: {
        name: data.name,
        config: data.config,
        isDefault: data.isDefault,
      },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating layout:", error.message);
    return { success: false, error: error.message || "Gagal memperbarui layout" };
  }
};

/**
 * Menghapus Layout
 */
export const deleteLayout = async (id: string) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const existingLayout = await prisma.layout.findUnique({ where: { id } });
    if (!existingLayout) throw new Error("Layout tidak ditemukan");

    // Proteksi kepemilikan sebelum proses hapus diizinkan
    if (existingLayout.userId !== deviceId) {
      throw new Error("Forbidden: Anda tidak memiliki akses untuk menghapus layout ini");
    }

    await prisma.layout.delete({ where: { id } });
    return { success: true, message: "Layout berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting layout:", error.message);
    return { success: false, error: error.message || "Gagal menghapus layout" };
  }
};