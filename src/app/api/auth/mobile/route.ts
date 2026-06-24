import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { DEFAULT_SETTINGS_FIRST_LOGIN, DefaultConfigLayout, DefaultTagihanLayout, DefaultListrikLayout } from "@/lib/constanta";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken wajib dikirim dari Flutter" }, { status: 400 });
    }

    // 1. Verifikasi idToken langsung ke endpoint resmi Google API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const payload = await googleRes.json();

    if (payload.error || !payload.email) {
      return NextResponse.json({ error: "Token Google tidak valid atau kedaluwarsa" }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || "User Kasir";
    const image = payload.picture || null;

    // 2. Cek apakah user sudah terdaftar di database menggunakan Raw SQL (konsisten dengan style kodinganmu)
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "user" WHERE email = $1 LIMIT 1`, email
    );
    let userRow = rows?.[0];

    // 3. AUTO-REGISTER: Jika user belum ada, daftarkan dan jalankan logic event createUser milikmu
    if (!userRow) {
      // Ambil default role dan license free tier (sesuaikan id-nya dengan DB kamu, misal 'cl-user' & 'free-tier')
      const defaultRoleId = "cl-user"; 
      const defaultLicenseId = "free-tier"; // Sesuaikan dengan ID lisensi standar di tabel license kamu
      const defaultQuota = 10;

      // Create User Baru
      await prisma.$executeRawUnsafe(
        `INSERT INTO "user" (id, name, email, image, kuota, role_id, license_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        crypto.randomUUID(), name, email, image, defaultQuota, defaultRoleId, defaultLicenseId
      );

      // Ambil data user yang baru saja dibuat
      const newRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM "user" WHERE email = $1 LIMIT 1`, email
      );
      userRow = newRows[0];

      // Inject data settings dan layout default persis seperti isi event createUser di auth.ts kamu
      try {
        await prisma.settings.create({
          data: {
            userId: userRow.id,
            data: DEFAULT_SETTINGS_FIRST_LOGIN as any
          }
        });

        await prisma.layout.createMany({
          data: [
            { name: "STRUK TRANSFER BANK", userId: userRow.id, isDefault: true, config: DefaultConfigLayout as any },
            { name: "STRUK PEMBAYARAN TAGIHAN", userId: userRow.id, isDefault: true, config: DefaultTagihanLayout as any },
            { name: "STRUK TOKEN LISTRIK", userId: userRow.id, isDefault: true, config: DefaultListrikLayout as any },
          ]
        });
      } catch (errInit) {
        console.error("Gagal melakukan init layout default pada mobile login:", errInit);
      }
    }

    // 4. GENERATE JWT TOKEN NEXT-AUTH (Sesuai dengan apa yang dibaca oleh callback jwt & session)
    const today = new Date().toISOString().slice(0, 10);
    
    // Taruh semua properti yang dibutuhkan oleh callback jwt() milikmu
    const sessionToken = await encode({
      secret: process.env.AUTH_SECRET!,
      token: {
        sub: userRow.id, // Ini user.id yang akan mentrigger query data role/license/kuota di auth.ts
        kuotaDate: today, 
      },
      salt: "authjs.session-token", // Salt enkripsi bawaan Next-Auth v5
      maxAge: 1 * 24 * 60 * 60, // Sesuai dengan maxAge authConfig kamu (1 hari)
    });

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: userRow.id,
        email: email,
        name: name,
      }
    });

  } catch (error) {
    console.error("Error pada API Mobile Auth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}