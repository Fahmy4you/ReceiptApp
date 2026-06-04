import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ROLES } from "@/lib/constanta";
import { auth } from "@/lib/auth";

/**
 * Mendapatkan semua user (Hanya Admin)
 */
export const getAllUsers = async (filters?: {
  roleId?: string;
  sortBy?: keyof Prisma.UserOrderByWithRelationInput;
  order?: "asc" | "desc";
}) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  // Proteksi: Jika bukan admin, dilarang list semua user
  if (!isAdmin) {
    throw new Error("Forbidden: Akses ditolak");
  }

  try {
    const users = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT id, name, email, role_id, kuota FROM "user" ORDER BY "createdAt" DESC`
    );
    return users as any;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Mendapatkan user berdasarkan ID
 * User biasa hanya bisa mengambil data dirinya sendiri
 */
export const getUserById = async (id: string) => {
  const session = await auth();
  if (!session) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  // Proteksi: Jika bukan admin DAN bukan ID dirinya sendiri, blokir
  if (!isAdmin && session.user.id !== id) {
    return null;
  }

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string | null; email: string | null }>>(
      `SELECT id, name, email FROM "user" WHERE id = $1 LIMIT 1`, id
    );
    return rows?.[0] || null;
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return null;
  }
};

/**
 * Update User
 * User biasa hanya bisa update data dirinya sendiri
 */
export const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  // Proteksi: User hanya bisa update dirinya sendiri
  if (!isAdmin && session.user.id !== id) {
    throw new Error("Forbidden: Anda hanya bisa mengubah profil Anda sendiri");
  }

  // Tambahan Keamanan: User biasa tidak boleh mengubah 'role' miliknya sendiri menjadi admin
  if (!isAdmin && data.role) {
    delete data.role;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Gagal memperbarui user" };
  }
};

/**
 * Delete User
 * User biasa hanya bisa menghapus akunnya sendiri
 */
export const deleteUser = async (id: string) => {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  const isAdmin = session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id;

  // Proteksi: User hanya bisa hapus dirinya sendiri
  if (!isAdmin && session.user.id !== id) {
    throw new Error("Forbidden: Anda hanya bisa menghapus akun Anda sendiri");
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    return { success: true, message: "User berhasil dihapus" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Gagal menghapus user" };
  }
};