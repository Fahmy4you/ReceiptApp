"use server"
import { DEFAULT_SETTINGS_FIRST_LOGIN, DefaultEwalletLayout, DefaultListrikLayout } from "@/lib/constanta";
import { getDeviceIdentifier } from "@/lib/getDeviceIdentifier";
import { prisma } from "@/lib/prisma";
import { SettingsData } from "@/lib/types";
import { Prisma } from "@prisma/client";

/**
 * Mengambil atau otomatis membuat data akun perangkat saat ini.
 * Sangat berguna untuk halaman Home/Dashboard agar data kuota langsung sinkron.
 */
export const getOrCreateCurrentUser = async () => {
  try {
    const deviceId = await getDeviceIdentifier(); 
    const now = new Date();

    // 1. Cari data perangkat
    let user = await prisma.user.findUnique({
      where: { id: deviceId },
    });

    // 2. JIKA BELUM ADA (Perangkat Baru): Buat data baru + set lastLogin awal
    if (!user) {
      console.log(`[Pendaftaran] Mendaftarkan perangkat baru: ${deviceId}`);
      user = await prisma.user.create({
        data: { 
          id: deviceId,
          lastLogin: now, // 🔥 Set waktu masuk pertama kali
        },
      });

      await prisma.settings.create({
        data: {
          userId: user.id,
          data: DEFAULT_SETTINGS_FIRST_LOGIN as unknown as Prisma.InputJsonValue
        }
      });

      await prisma.layout.createMany({
        data: [
          {
            name: "Layout E-Wallet Default",
            userId: user.id,
            isDefault: true,
            config: DefaultEwalletLayout as any
          },
          {
            name: "Layout Token Listrik Default",
            userId: user.id,
            isDefault: false,
            config: DefaultListrikLayout as any
          }
        ]
      });
      console.log(`Settings dan Layout otomatis dibuat untuk user: ${user.id}`);
    } 
    
    // 3. JIKA SUDAH ADA (Perangkat Lama Datang Lagi): Update waktu lastLogin terbaru
    else {
      user = await prisma.user.update({
        where: { id: deviceId },
        data: { 
          lastLogin: now, // 🔥 Perbarui setiap kali halaman home dimuat ulang
        },
      });
    }

    return user;
  } catch (error: any) {
    console.error("Gagal menjalankan fungsi getOrCreateCurrentUser:", error.message);
    return null;
  }
};

/**
 * Mendapatkan data user/perangkat berdasarkan ID yang diminta.
 * Diproteksi ketat agar perangkat lain tidak bisa iseng menembak ID via parameter.
 */
export const getUserById = async (id: string) => {
  try {
    const currentDeviceId = await getDeviceIdentifier();

    // Proteksi: Jika ID yang diminta di url/form beda dengan ID asli browser saat ini, BLOKIR
    if (currentDeviceId !== id) {
      console.warn(`[Ilegal] Perangkat ${currentDeviceId} mencoba mengintip data milik ${id}`);
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error("Error fetching data by fingerprint id:", error);
    return null;
  }
};

/**
 * Update Data Perangkat (Misal update nama perangkat, sisa kuota, dll)
 * Mengunci edit data hanya bisa dilakukan oleh perangkat itu sendiri
 */
export const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
  try {
    const currentDeviceId = await getDeviceIdentifier();

    if (currentDeviceId !== id) {
      throw new Error("Akses Ditolak: Anda hanya bisa mengubah data profil perangkat Anda sendiri");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
    return { success: true, data: updatedUser };
  } catch (error: any) {
    console.error("Error updating user data:", error.message);
    return { success: false, error: error.message || "Gagal memperbarui data" };
  }
};

/**
 * Hapus seluruh data perangkat dari database (Reset data perangkat)
 */
export const deleteUser = async (id: string) => {
  try {
    const currentDeviceId = await getDeviceIdentifier();

    if (currentDeviceId !== id) {
      throw new Error("Akses Ditolak: Anda hanya bisa menghapus data perangkat Anda sendiri");
    }

    await prisma.user.delete({
      where: { id },
    });
    return { success: true, message: "Data perangkat berhasil dibersihkan dari database" };
  } catch (error: any) {
    console.error("Error deleting user data:", error.message);
    return { success: false, error: error.message || "Gagal menghapus data" };
  }
};