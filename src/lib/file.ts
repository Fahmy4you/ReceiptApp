import { unlink } from "fs/promises";
import path from "path";

export async function deleteFile(relativePath: string) {

  let msg = `Mencoba menghapus file: ${relativePath}`;

  try {
    // Pastikan path diawali dengan public agar mengarah ke folder yang benar
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    await unlink(absolutePath);
    msg = `Berhasil menghapus file: ${relativePath}`;
    console.log(msg);
    return { success: true, message: "File berhasil dihapus" };

  } catch (error: any) {
    // Jika file tidak ditemukan, jangan biarkan aplikasi crash
    if (error.code === 'ENOENT') {
        msg = `File tidak ditemukan, tidak perlu dihapus: ${relativePath}`;
        console.warn(msg);
        return { success: false, message: "File tidak ditemukan, tidak perlu dihapus" };
    } else {
        msg = `Gagal menghapus file: ${relativePath}`;
        console.error(msg, error);
        return { success: false, message: "Gagal menghapus file" };
    }
  }
}