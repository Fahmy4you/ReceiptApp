"use server"
import { prisma } from "@/lib/prisma";
import { Prisma, TypeReceipt } from "@prisma/client";
import { ROLES } from "@/lib/constanta";
import { getUserById } from "./User";
import { auth } from "@/lib/auth";

export const getAllReceipts = async (filters?: {
  userId?: string;
  startDateCreatedAt?: Date;
  endDateCreatedAt?: Date;
  startDateUpdatedAt?: Date;
  endDateUpdatedAt?: Date;
  sortBy?: keyof Prisma.ReceiptOrderByRelationAggregateInput;
  order?: "asc" | "desc";
  limit?: number; // Tambahkan parameter limit opsional di sini
}) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  // 1. Cek apakah user adalah Admin
  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  try {
    const receipts = await prisma.receipt.findMany({
      where: {
        // Jika Admin: gunakan userId dari parameter (kalau ada), kalau tidak ada ambil semua.
        // Jika User: abaikan parameter userId dan paksa gunakan ID miliknya sendiri.
        userId: isAdmin 
          ? (filters?.userId || undefined) 
          : session.user.id,
        
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
        // Jika sortBy ada, gunakan itu. Jika tidak, default ke createdAt
        [filters?.sortBy || "createdAt"]: filters?.order || "desc",
      },
      // PERUBAHAN DI SINI: Gunakan properti take untuk membatasi jumlah data
      take: filters?.limit || undefined, 
    });

    return receipts;
  } catch (error) {
    console.error("Error fetching receipts :", error);
    return [];
  }
};

export const getReceiptById = async (id: string) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  // 1. Cek apakah user adalah Admin
  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        layout: true
      }
    });

    if (!receipt) return null;

    // Jika bukan admin dan bukan pemiliknya, blokir akses
    if (!isAdmin && receipt.userId !== session.user.id) {
        return null; 
    }

    return receipt;
  } catch (error) {
    console.error("Error fetching receipt by id :", error);
    return null;
  }
};

export const createReceipt = async (data: {
  nama: string;
  layoutId: string | null;
  total: number | null;
  userId?: string;
  content: any;
  type: TypeReceipt
}) => {
  const session = await auth();
  
  // 1. Validasi awal: Jika tidak ada session atau ID, stop di sini.
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
  let userIdCheck: string;

  if(isAdmin && data.userId != undefined) {
    userIdCheck = data.userId;
  } else {
    userIdCheck = session.user.id;
  }

  const user = await getUserById(userIdCheck);

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const newReceipt = await prisma.receipt.create({
      data: {
        nama: data.nama,
        layoutId: data.layoutId,
        total: data.total,
        userId: userIdCheck,
        content: data.content,
        type: data.type
      },
    });

    return { success: true, data: newReceipt };
  } catch (error) {
    console.error("Error creating receipt:", error);
    return { success: false, error: "Gagal menyimpan data" };
  }
};

export const updateReceipt = async (id: string, data: {
  userId?: string;
  content: any;
}) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  // 1. Cari data lama untuk cek kepemilikan
  const existingReceipt = await prisma.receipt.findUnique({
    where: { id }
  });

  if (!existingReceipt) throw new Error("Receipt not found");

  // 2. Security Check: Jika bukan admin, pastikan dia pemiliknya
  if (!isAdmin && existingReceipt.userId !== session.user.id) {
    throw new Error("Forbidden: Anda tidak memiliki akses ke data ini");
  }

  // 3. Tentukan userId baru (jika admin ingin mengubah owner)
  let targetUserId = existingReceipt.userId;
  if (isAdmin && data.userId) {
    const userExists = await getUserById(data.userId);
    if (!userExists) throw new Error("Target user not found");
    targetUserId = data.userId;
  }

  try {
    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        userId: targetUserId,
        content: data.content,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating receipt:", error);
    return { success: false, error: "Gagal memperbarui data" };
  }
};

/**
 * Mendapatkan semua Receipt untuk Admin — termasuk data user (nama, email)
 */
export const getAllReceiptsAdmin = async (filters?: {
  userId?: string;
  startDateCreatedAt?: Date;
  endDateCreatedAt?: Date;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  limit?: number;
}) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
  if (!isAdmin) throw new Error("Forbidden: Akses ditolak");

  try {
    const receipts = await prisma.receipt.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.startDateCreatedAt && filters?.endDateCreatedAt && {
          createdAt: {
            gte: filters.startDateCreatedAt,
            lte: filters.endDateCreatedAt,
          },
        }),
        ...(filters?.search && {
          OR: [
            { nama: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { layout: true },
      orderBy: {
        ...(filters?.sortBy ? { [filters.sortBy]: filters.order || "desc" } : { createdAt: "desc" }),
      },
      take: filters?.limit || undefined,
    });

    // Fetch user data separately using raw SQL
    const userIds = [...new Set(receipts.map((r) => r.userId))];
    const users = userIds.length > 0
      ? await prisma.$queryRawUnsafe<Array<{ id: string; name: string | null; email: string | null }>>(
          `SELECT id, name, email FROM "user" WHERE id = ANY($1)`,
          userIds
        )
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return receipts.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }));
  } catch (error) {
    console.error("Error fetching admin receipts:", error);
    return [];
  }
};

export const deleteReceipt = async (
  id: string,
  // 💡 Tambahkan parameter opsional injection untuk support mobile app (Bearer Token)
  overrideUser?: { id: string; roleId: string; roleName: string }
) => {
  let currentUserId = "";
  let isAdmin = false;

  if (overrideUser) {
    // 🔥 JIKA REQUEST DARI FLUTTER (Menggunakan data injection dari API Route)
    isAdmin = overrideUser.roleName === "admin" || overrideUser.roleId === "cl-admin"; // Sesuaikan ID admin websitemu jika berbeda
    currentUserId = overrideUser.id;
  } else {
    // 🌐 JIKA REQUEST DARI WEB SEPERTI BIASA (Menggunakan Next-Auth Session)
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthenticated");

    isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;
    currentUserId = session.user.id;
  }

  // 1. Cari data untuk cek validitas & kepemilikan
  const existingReceipt = await prisma.receipt.findUnique({
    where: { id }
  });

  if (!existingReceipt) throw new Error("Receipt not found");

  // 2. Security Check: Bukan admin & bukan pemilik asli? Blokir langsung!
  if (!isAdmin && existingReceipt.userId !== currentUserId) {
    throw new Error("Forbidden: Anda tidak diizinkan menghapus data ini");
  }

  try {
    await prisma.receipt.delete({
      where: { id },
    });

    return { success: true, message: "Data berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting receipt:", error);
    return { success: false, error: "Gagal menghapus data" };
  }
};