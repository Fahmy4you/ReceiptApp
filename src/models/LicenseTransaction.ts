"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/constanta";
import { revalidatePath } from "next/cache";
import { TransactionStatus } from "@prisma/client";

/**
 * Proteksi Keamanan: Cek apakah user yang login saat ini adalah Admin
 */
const checkAdmin = (session: any) => {
  if (!session?.user?.role) return false;
  return (
    session.user.role.role == ROLES[0].value || 
    session.user.role.id == ROLES[0].id
  );
};

// ====================================================================
// SECTION 1: USER & CHECKOUT ACTIONS
// ====================================================================

/**
 * Membuat Transaksi Lisensi Baru (Pending) saat user klik Checkout
 */
export const createTransaction = async (data: {
  licenseId: string;
  total: number;
  billingCycle: any; 
  paymentMethod: any; 
  paymentCode?: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };

  try {
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() + 24); // Expiry 24 Jam

    const newTx = await prisma.licenseTRX.create({
      data: {
        userId: session.user.id,
        licenseId: data.licenseId,
        total: data.total,
        billingCycle: data.billingCycle,
        paymentMethod: data.paymentMethod,
        paymentCode: data.paymentCode || null,
        status: "PENDING",
        expiredDate: expiredDate,
      },
      include: { license: true },
    });

    return { success: true, data: newTx };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Gagal membuat invoice transaksi" };
  }
};

/**
 * Mengubah Status Transaksi & Otomatis Update Fitur/Kuota User (Callback / Simulator)
 */
export const updateTransactionStatus = async (txId: string, newStatus: TransactionStatus) => {
  try {
    const transaction = await prisma.licenseTRX.findUnique({
      where: { id: txId },
      include: { license: true }
    });

    if (!transaction) return { success: false, error: "Transaksi tidak ditemukan" };
    if (transaction.status != "PENDING") return { success: false, error: "Transaksi sudah diproses sebelumnya" };

    const result = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.licenseTRX.update({
        where: { id: txId },
        data: { status: newStatus },
      });

      if (newStatus == "SUCCESS" && transaction.license) {
        const endDate = new Date();
        if (transaction.billingCycle == "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Tiering kuota berdasarkan kasta levelLicense
        let tambahanKuota = 0;
        if (transaction.license.levelLicense == 3) tambahanKuota = 0;      // Platinum
        else if (transaction.license.levelLicense == 2) tambahanKuota = 100;   // Gold
        else if (transaction.license.levelLicense == 1) tambahanKuota = 30;    // Silver

        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            license_id: transaction.licenseId,
            licenseEndDate: endDate,
            kuota: tambahanKuota
          },
        });

        // Tambah counter total pembelian lisensi
        await tx.license.update({
          where: { id: transaction.licenseId },
          data: { pembelian: { increment: 1 } }
        });
      }

      return updatedTx;
    });

    revalidatePath("/pricing");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return { success: false, error: "Gagal memperbarui status transaksi" };
  }
};

/**
 * Mendapatkan riwayat transaksi milik user yang sedang aktif log-in
 */
export const getMyTransactionHistory = async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    return await prisma.licenseTRX.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        license: { select: { name: true, levelLicense: true } }
      }
    });
  } catch (error) {
    console.error("Error fetching user transaction history:", error);
    return [];
  }
};


// ====================================================================
// SECTION 2: ADMIN ONLY ACTIONS (MANAJEMEN DASHBOARD)
// ====================================================================

/**
 * Admin: Mendapatkan SEMUA transaksi dari seluruh user untuk dipantau di dashboard
 */
export const getAllTransactions = async (filters?: { status?: TransactionStatus; search?: string }) => {
  const session = await auth();
  if (!session?.user || !checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  try {
    const transactions = await prisma.licenseTRX.findMany({
      where: {
        // Filter opsional berdasarkan status (PENDING/SUCCESS/FAILED)
        ...(filters?.status && { status: filters.status }),
        // Filter pencarian opsional berdasarkan email atau nama user
        ...(filters?.search && {
          user: {
            OR: [
              { email: { contains: filters.search, mode: "insensitive" } },
              { name: { contains: filters.search, mode: "insensitive" } },
            ]
          }
        })
      },
      orderBy: { createdAt: "desc" }, // Transaksi terbaru selalu di paling atas
      include: {
        user: {
          select: { name: true, email: true, image: true } // Menampilkan identitas pembeli
        },
        license: {
          select: { name: true, levelLicense: true, priceMonthly: true, priceYearly: true }
        }
      }
    });
    return transactions;
  } catch (error) {
    console.error("Error Admin fetching all transactions:", error);
    return [];
  }
};

/**
 * Admin / User Terkait: Mendapatkan detail satu transaksi secara super spesifik berdasarkan ID
 */
export const getTransactionById = async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  try {
    const transaction = await prisma.licenseTRX.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, whatsappNumber: true } },
        license: true
      }
    });

    if (!transaction) return null;

    // Proteksi Keamanan: Hanya admin ATAU user pemilik transaksi tersebut yang boleh mengintip detail ini
    if (!checkAdmin(session) && transaction.userId !== session.user.id) {
      throw new Error("Forbidden: Anda tidak berhak melihat transaksi ini");
    }

    return transaction;
  } catch (error) {
    console.error("Error fetching transaction by id:", error);
    return null;
  }
};

export const getTransactionPendingByUserId = async (userId: string) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  try {
    const transaction = await prisma.licenseTRX.findFirst({
      where: { userId, status: "PENDING" },
      include: {
        user: { select: { name: true, email: true, whatsappNumber: true } },
        license: true
      }
    });

    if (!transaction) return null;

    return transaction;
  } catch (error) {
    console.error("Error fetching transaction by id:", error);
    return null;
  }
};

export const getTransactionNoPendingByUserId = async (userId: string) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  try {
    const transaction = await prisma.licenseTRX.findFirst({
      where: { userId, status: {not: "PENDING"} },
      include: {
        user: { select: { name: true, email: true, whatsappNumber: true } },
        license: true
      }
    });

    if (!transaction) return null;

    return transaction;
  } catch (error) {
    console.error("Error fetching transaction by id:", error);
    return null;
  }
};

/**
 * Admin: Menghapus log/riwayat transaksi dari database (Hard Delete)
 */
export const deleteTransaction = async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");
  if (!checkAdmin(session)) throw new Error("Forbidden: Akses ditolak");

  try {
    const existingTx = await prisma.licenseTRX.findUnique({ where: { id } });
    if (!existingTx) return { success: false, error: "Data transaksi tidak ditemukan" };

    await prisma.licenseTRX.delete({
      where: { id }
    });

    return { success: true, message: "Log riwayat transaksi berhasil dihapus dari sistem." };
  } catch (error) {
    console.error("Error Admin deleting transaction:", error);
    return { success: false, error: "Gagal menghapus transaksi. Data kemungkinan memiliki relasi aktif." };
  }
};