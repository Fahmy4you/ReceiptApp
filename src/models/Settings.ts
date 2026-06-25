"use server"
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ROLES } from "@/lib/constanta";
import { deleteFile } from "@/lib/file";
import { auth } from "@/lib/auth";

export const getAllSettings = async (filters?: {
  sortBy?: keyof Prisma.SettingsOrderByWithRelationInput;
  order?: "asc" | "desc";
}) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  // 1. Proteksi: Hanya Admin yang boleh list semua settings
  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
  if (!isAdmin) {
    throw new Error("Forbidden: Anda tidak memiliki akses untuk melihat semua pengaturan.");
  }

  try {
    const allSettings = await prisma.settings.findMany({
      orderBy: {
        [filters?.sortBy || "createdAt"]: filters?.order || "desc",
      },
      // Opsional: Sertakan info user agar admin tahu ini settings milik siapa
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    return allSettings;
  } catch (error) {
    console.error("Error fetching all settings:", error);
    return [];
  }
};

export const getSettingByUserId = async (
  targetUserId?: string,
  // 💡 Tambahkan parameter opsional injection untuk support mobile app
  overrideUser?: { id: string; roleId: string; roleName: string }
) => {
  let finalUserId = "";
  let isAdmin = false;

  if (overrideUser) {
    // 🔥 JIKA REQUEST DARI FLUTTER (Menggunakan data injection dari API Route)
    isAdmin = overrideUser.roleName === "admin" || overrideUser.roleId === "cl-admin";
    finalUserId = isAdmin && targetUserId ? targetUserId : overrideUser.id;
  } else {
    // 🌐 JIKA REQUEST DARI WEB SPERTI BIASA
    const session = await auth();
    if (!session) throw new Error("Unauthenticated");

    isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
    finalUserId = isAdmin && targetUserId ? targetUserId : session.user.id;
  }

  try {
    const settings = await prisma.settings.findFirst({
      where: { userId: finalUserId },
    });
    
    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
};


export const upsertSettings = async (data: {
  userId?: string;
  data: any; // Ini field 'data' di model yang bertipe Json
}) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
  const finalUserId = isAdmin && data.userId ? data.userId : session.user.id;

  try {
    // Cari dulu apakah sudah ada
    const existingSettings = await prisma.settings.findFirst({
      where: { userId: finalUserId }
    });

    if (existingSettings) {
      // Jika ada, update
      const updated = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: { data: data.data },
      });
      return { success: true, action: "update", data: updated };
    } else {
      // Jika belum ada, create
      const created = await prisma.settings.create({
        data: {
          userId: finalUserId,
          data: data.data,
        },
      });
      return { success: true, action: "create", data: created };
    }
  } catch (error) {
    console.error("Error upserting settings:", error);
    return { success: false, error: "Gagal menyimpan pengaturan" };
  }
};


export const deleteSettings = async (id: string) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  const existingSettings = await prisma.settings.findUnique({
    where: { id }
  });

  if (!existingSettings) throw new Error("Settings tidak ditemukan");

  // Proteksi kepemilikan
  if (!isAdmin && existingSettings.userId !== session.user.id) {
    throw new Error("Forbidden: Akses ditolak");
  }

  try {
    await prisma.settings.delete({
      where: { id },
    });
    return { success: true, message: "Pengaturan berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting settings:", error);
    return { success: false, error: "Gagal menghapus pengaturan" };
  }
};

export const upsertSettingsAction = async (data: {
  userId?: string;
  data: any; 
}) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
  const finalUserId = isAdmin && data.userId ? data.userId : session.user.id;

  // Variabel untuk menampung path file yang akan dihapus nanti
  let fileToDelete: string | null = null;

  try {
    const existingSettings = await prisma.settings.findFirst({
      where: { userId: finalUserId }
    });

    if (existingSettings) {
      const oldData = existingSettings.data as any;
      const newData = data.data;

      // 1. Tentukan apakah ada file yang perlu dihapus
      if (oldData?.logo && newData?.logo && oldData.logo != newData.logo && oldData.logo) {
        if (oldData.logo.startsWith("/image/upload/")) {
          // Kita simpan path-nya saja, JANGAN dihapus dulu
          fileToDelete = oldData.logo;
        }
      }

      // 2. Lakukan Update Database
      const updated = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: { data: data.data },
      });

      // 3. JIKA database sukses, baru hapus file fisiknya
      if (fileToDelete) {
        await deleteFile(fileToDelete);
      }

      return { success: true, data: updated };
    } else {
      // Logika create (tidak ada yang perlu dihapus karena data baru)
      const created = await prisma.settings.create({
        data: { userId: finalUserId, data: data.data },
      });
      return { success: true, data: created };
    }
  } catch (error) {
    console.error("Gagal simpan settings:", error);
    return { success: false, error: "Gagal menyimpan ke database" };
  }
};