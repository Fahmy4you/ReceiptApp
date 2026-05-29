"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getDeviceIdentifier } from "@/lib/getDeviceIdentifier"; // Import helper global kamu
import { TypeReceipt } from "@/lib/types";

/**
 * Mendapatkan semua riwayat transaksi struk milik perangkat saat ini
 */
export const getAllReceipts = async (filters?: {
  startDateCreatedAt?: Date;
  endDateCreatedAt?: Date;
  startDateUpdatedAt?: Date;
  endDateUpdatedAt?: Date;
  sortBy?: keyof Prisma.ReceiptOrderByWithRelationInput;
  order?: "asc" | "desc";
  limit?: number; 
  page?: number; 
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    // Hitung skip kalau misal pakai pagination (default page = 1)
    const limit = filters?.limit;
    const page = filters?.page || 1;
    const skip = limit ? (page - 1) * limit : undefined;

    const receipts = await prisma.receipt.findMany({
      where: {
        // Hanya ambil data struk milik browser perangkat saat ini
        userId: deviceId,
        
        ...(filters?.startDateCreatedAt && filters?.endDateCreatedAt && {
          createdAt: {
            gte: filters.startDateCreatedAt,
            lte: filters.endDateCreatedAt,
          },
        }),

        ...(filters?.startDateUpdatedAt && filters?.endDateUpdatedAt && {
          updatedAt: {
            gte: filters.startDateUpdatedAt,
            lte: filters.endDateUpdatedAt,
          },
        }),
      },
      include: {
        layout: true
      },
      orderBy: {
        [filters?.sortBy || "createdAt"]: filters?.order || "desc",
      },
      // Pasang limit (take) dan offset (skip) di sini
      ...(limit && { take: limit }),
      ...(skip !== undefined && { skip: skip }),
    });

    return receipts;
  } catch (error: any) {
    console.error("Error fetching receipts :", error.message);
    return [];
  }
};

/**
 * Mendapatkan data satu struk spesifik berdasarkan ID
 */
export const getReceiptById = async (id: string) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        layout: true
      }
    });

    if (!receipt) return null;

    // Proteksi: Mencegah perangkat lain mengintip data struk dengan cara ganti ID di parameter
    if (receipt.userId !== deviceId) {
      return null; 
    }

    return receipt;
  } catch (error) {
    console.error("Error fetching receipt by id :", error);
    return null;
  }
};

/**
 * Menyimpan data riwayat struk baru ke database
 */
export const createReceipt = async (data: {
  nama: string;
  layoutId: string | null;
  total: number | null;
  content: any;
  type: TypeReceipt
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const newReceipt = await prisma.receipt.create({
      data: {
        nama: data.nama,
        layoutId: data.layoutId,
        total: data.total,
        userId: deviceId, // Diikat ke ID unik sidik jari perangkat saat ini
        content: data.content,
        type: data.type
      },
    });

    return { success: true, data: newReceipt };
  } catch (error: any) {
    console.error("Error creating receipt:", error.message);
    return { success: false, error: "Gagal menyimpan data struk" };
  }
};

/**
 * Memperbarui isi konten data struk yang sudah tersimpan
 */
export const updateReceipt = async (id: string, data: {
  content: any;
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    // 1. Cari data lama untuk validasi kepemilikan
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) throw new Error("Data struk tidak ditemukan");

    // 2. Security Check: Hanya perangkat yang membuat struk ini yang boleh mengubahnya
    if (existingReceipt.userId !== deviceId) {
      throw new Error("Forbidden: Anda tidak memiliki akses ke data ini");
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        content: data.content,
      },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating receipt:", error.message);
    return { success: false, error: error.message || "Gagal memperbarui data" };
  }
};

/**
 * Menghapus data riwayat struk dari database
 */
export const deleteReceipt = async (id: string) => {
  try {
    const deviceId = await getDeviceIdentifier();

    // 1. Cari data lama untuk validasi kepemilikan sebelum dihapus
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id }
    });

    if (!existingReceipt) throw new Error("Data struk tidak ditemukan");

    // 2. Security Check: Hanya perangkat pembuat yang boleh menghapus
    if (existingReceipt.userId !== deviceId) {
      throw new Error("Forbidden: Anda tidak diizinkan menghapus data ini");
    }

    await prisma.receipt.delete({
      where: { id },
    });

    return { success: true, message: "Data struk berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting receipt:", error.message);
    return { success: false, error: error.message || "Gagal menghapus data" };
  }
};