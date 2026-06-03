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

export const updateLicense = async (id: string, data: {
  name?: string;
  description?: string;
  features?: any;
  colorTheme?: string;
  buttonTheme?: string;
  priceMonthly?: number;
  priceYearly?: number;
  discount?: number | null;
  icon?: string;
}) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  try {
    const updated = await prisma.license.update({ where: { id }, data });
    revalidatePath("/pricing");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating license:", error);
    return { success: false, error: "Gagal memperbarui lisensi" };
  }
};
