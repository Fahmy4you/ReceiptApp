"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ROLES } from "@/lib/constanta";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Cek apakah user yang login saat ini adalah Admin
 */
const checkAdmin = (session: any) => {
  if (!session?.user?.role) return false;
  return (
    session.user.role.role == ROLES[0].value || 
    session.user.role.id == ROLES[0].id
  );
};

/**
 * Mendapatkan semua License
 * Publik/User/Admin: Semua bisa melihat lisensi yang tersedia (untuk halaman pricing)
 */
export const getAllLicenses = async (filters?: {
  sortBy?: keyof Prisma.LicenseOrderByWithRelationInput;
  order?: "asc" | "desc";
}) => {
  try {
    const licenses = await prisma.license.findMany({
      orderBy: {
        [filters?.sortBy || "createdAt"]: filters?.order || "asc", // Urutkan dari yang termurah/terlama biasanya asc
      },
    });
    return licenses;
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return [];
  }
};

/**
 * Mendapatkan License berdasarkan ID
 */
export const getLicenseById = async (id: string) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id },
    });
    return license;
  } catch (error) {
    console.error("Error fetching license by id:", error);
    return null;
  }
};

/**
 * Create License (Hanya Admin)
 */
export const createLicense = async (data: {
  name: string;
  description: string;
  features: any; // Mengakomodasi tipe Json Prisma
  colorTheme: string;
  buttonTheme: string;
  priceMonthly: number;
  priceYearly: number;
  discount?: number;
  icon: string;
}) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  // Proteksi: Hanya admin yang bisa membuat paket lisensi baru
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  try {
    const newLicense = await prisma.license.create({
      data: {
        name: data.name,
        description: data.description,
        features: data.features,
        colorTheme: data.colorTheme,
        buttonTheme: data.buttonTheme,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        discount: data.discount ?? null,
        icon: data.icon,
      },
    });

    revalidatePath("/pricing"); // Revalidate halaman paket harga jika ada cache
    return { success: true, data: newLicense };
  } catch (error: any) {
    console.error("Error creating license:", error);
    return { 
      success: false, 
      error: error.code === "P2002" ? "Nama lisensi sudah digunakan" : "Gagal membuat lisensi" 
    };
  }
};

/**
 * Update License (Hanya Admin)
 */
export const updateLicense = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    features?: any;
    colorTheme?: string;
    buttonTheme?: string;
    priceMonthly?: number;
    priceYearly?: number;
    discount?: number | null;
    icon?: string;
  }
) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  // Proteksi: Hanya admin yang bisa update lisensi
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  const existingLicense = await prisma.license.findUnique({ where: { id } });
  if (!existingLicense) throw new Error("Lisensi tidak ditemukan");

  try {
    const updatedLicense = await prisma.license.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        features: data.features,
        colorTheme: data.colorTheme,
        buttonTheme: data.buttonTheme,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        discount: data.discount,
        icon: data.icon,
      },
    });

    revalidatePath("/pricing");
    return { success: true, data: updatedLicense };
  } catch (error) {
    console.error("Error updating license:", error);
    return { success: false, error: "Gagal memperbarui lisensi" };
  }
};

/**
 * Delete License (Hanya Admin)
 */
export const deleteLicense = async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  // Proteksi: Hanya admin yang bisa menghapus lisensi
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  const existingLicense = await prisma.license.findUnique({ where: { id } });
  if (!existingLicense) throw new Error("Lisensi tidak ditemukan");

  try {
    await prisma.license.delete({ where: { id } });
    revalidatePath("/pricing");
    return { success: true, message: "Lisensi berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting license:", error);
    return { 
      success: false, 
      error: "Gagal menghapus lisensi. Pastikan tidak ada pengguna yang sedang aktif menggunakan lisensi ini." 
    };
  }
};