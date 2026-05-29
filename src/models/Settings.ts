"use server"
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/file";
import { getDeviceIdentifier } from "@/lib/getDeviceIdentifier"; // Import helper global kamu

/**
 * Mendapatkan Pengaturan (Settings) khusus untuk perangkat saat ini
 */
export const getSettingByUserId = async () => {
  try {
    const deviceId = await getDeviceIdentifier();

    const settings = await prisma.settings.findFirst({
      where: { userId: deviceId },
    });
    
    return settings;
  } catch (error: any) {
    console.error("Error fetching settings:", error.message);
    return null;
  }
};

/**
 * Update atau Create (Upsert) Pengaturan Standar Perangkat
 */
export const upsertSettings = async (data: {
  data: any; // Field 'data' di model Prisma bertipe Json
}) => {
  try {
    const deviceId = await getDeviceIdentifier();

    // Cari dulu apakah perangkat ini sudah pernah menyimpan pengaturan
    const existingSettings = await prisma.settings.findFirst({
      where: { userId: deviceId }
    });

    if (existingSettings) {
      // Jika ada, lakukan update
      const updated = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: { data: data.data },
      });
      return { success: true, action: "update", data: updated };
    } else {
      // Jika belum ada, buat baru khusus untuk perangkat ini
      const created = await prisma.settings.create({
        data: {
          userId: deviceId,
          data: data.data,
        },
      });
      return { success: true, action: "create", data: created };
    }
  } catch (error: any) {
    console.error("Error upserting settings:", error.message);
    return { success: false, error: "Gagal menyimpan pengaturan" };
  }
};

/**
 * Menghapus Pengaturan Perangkat
 */
export const deleteSettings = async (id: string) => {
  try {
    const deviceId = await getDeviceIdentifier();

    const existingSettings = await prisma.settings.findUnique({
      where: { id }
    });

    if (!existingSettings) throw new Error("Settings tidak ditemukan");

    // Proteksi kepemilikan: Hanya perangkat yang bersangkutan yang boleh menghapusnya
    if (existingSettings.userId !== deviceId) {
      throw new Error("Forbidden: Akses ditolak");
    }

    await prisma.settings.delete({
      where: { id },
    });
    return { success: true, message: "Pengaturan berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting settings:", error.message);
    return { success: false, error: error.message || "Gagal menghapus pengaturan" };
  }
};

/**
 * Update atau Create Pengaturan dengan fitur otomatis hapus file gambar Logo lama (Anti-Sampah)
 */
export const upsertSettingsAction = async (data: {
  data: any; 
}) => {
  try {
    const deviceId = await getDeviceIdentifier();
    let fileToDelete: string | null = null;

    const existingSettings = await prisma.settings.findFirst({
      where: { userId: deviceId }
    });

    if (existingSettings) {
      const oldData = existingSettings.data as any;
      const newData = data.data;

      // 1. Cek apakah ada file logo lama yang perlu dibersihkan dari server
      if (oldData?.logo && newData?.logo && oldData.logo != newData.logo) {
        if (oldData.logo.startsWith("/image/upload/")) {
          fileToDelete = oldData.logo;
        }
      }

      // 2. Lakukan Update Database
      const updated = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: { data: data.data },
      });

      // 3. JIKA database sukses aman terupdate, baru hapus file fisiknya
      if (fileToDelete) {
        await deleteFile(fileToDelete);
      }

      return { success: true, data: updated };
    } else {
      // Logika create awal jika data belum ada sama sekali
      const created = await prisma.settings.create({
        data: { userId: deviceId, data: data.data },
      });
      return { success: true, data: created };
    }
  } catch (error: any) {
    console.error("Gagal simpan settings via action:", error.message);
    return { success: false, error: "Gagal menyimpan ke database" };
  }
};