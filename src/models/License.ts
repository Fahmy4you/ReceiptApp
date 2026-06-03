"use server";

import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constanta";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const checkAdmin = (session: any) => {
  if (!session?.user?.role) return false;
  return session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
};

export const getAllLicenses = async (filters?: { sortBy?: string; order?: "asc" | "desc" }) => {
  try {
    return await prisma.license.findMany({
      orderBy: { levelLicense: filters?.order === "desc" ? "desc" : "asc" },
    });
  } catch (e) {
    console.error("Error fetching licenses:", e);
    return [];
  }
};

export const getLicenseById = async (id: string) => {
  try {
    return await prisma.license.findUnique({ where: { id } });
  } catch (e) {
    console.error("Error fetching license:", e);
    return null;
  }
};

export const createLicense = async (data: {
  name: string;
  description: string;
  features: any;
  colorTheme: string;
  buttonTheme: string;
  priceMonthly: number;
  priceYearly: number;
  discount?: number | null;
  icon: string;
  branding?: string | null;
  levelLicense: number;
  pembelian?: number;
}) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  try {
    const existingLevel = await prisma.license.findUnique({
      where: { levelLicense: data.levelLicense },
    });

    if (existingLevel) {
      return { success: false, error: `Level lisensi (${data.levelLicense}) sudah digunakan oleh paket lain!` };
    }

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
        branding: data.branding ?? null,
        levelLicense: data.levelLicense,
        pembelian: data.pembelian ?? 0,
      },
    });

    revalidatePath("/pricing");
    return { success: true, data: newLicense };
  } catch (error: any) {
    console.error("Error creating license:", error);
    if (error.code === "P2002") {
      const target = error.meta?.target as string[];
      if (target?.includes("level_license")) {
        return { success: false, error: "Level lisensi sudah digunakan" };
      }
      return { success: false, error: "Nama lisensi sudah digunakan" };
    }
    return { success: false, error: "Gagal membuat lisensi" };
  }
};

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
    branding?: string | null;
    levelLicense?: number;
    pembelian?: number;
  }
) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  const existingLicense = await prisma.license.findUnique({ where: { id } });
  if (!existingLicense) throw new Error("Lisensi tidak ditemukan");

  try {
    if (data.levelLicense !== undefined && data.levelLicense !== existingLicense.levelLicense) {
      const existingLevel = await prisma.license.findUnique({
        where: { levelLicense: data.levelLicense },
      });

      if (existingLevel) {
        return { success: false, error: `Level lisensi (${data.levelLicense}) sudah digunakan oleh paket lain!` };
      }
    }

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
        branding: data.branding,
        levelLicense: data.levelLicense,
        pembelian: data.pembelian,
      },
    });

    revalidatePath("/pricing");
    return { success: true, data: updatedLicense };
  } catch (error: any) {
    console.error("Error updating license:", error);
    if (error.code === "P2002") {
      return { success: false, error: "Nama atau Level lisensi sudah digunakan oleh paket lain" };
    }
    return { success: false, error: "Gagal memperbarui lisensi" };
  }
};

export const deleteLicense = async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  const existingLicense = await prisma.license.findUnique({ where: { id } });
  if (!existingLicense) throw new Error("Lisensi tidak ditemukan");

  try {
    await prisma.license.delete({ where: { id } });
    revalidatePath("/pricing");
    return { success: true, message: "Lisensi berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting license:", error);
    return { success: false, error: "Gagal menghapus lisensi. Pastikan tidak ada pengguna yang sedang aktif menggunakan lisensi ini." };
  }
};
