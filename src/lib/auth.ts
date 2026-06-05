import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET!,
  providers: [
    Google,
    Credentials({
      id: "credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const adminEmail = process.env.ADMIN_EMAIL || "admin@struk.app"
        const adminHash = process.env.ADMIN_PASSWORD_HASH || "$2b$10$FT1prq.8MtNKI965.ZUTZOzHTJfE18iVZa1BhbHoIpb4C8FmL5vSm"
        if (email !== adminEmail) return null

        const correct = await bcrypt.compare(password, adminHash)
        if (!correct) return null

        let user: any = null
        try {
          const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
            `SELECT id FROM "user" WHERE email = $1 LIMIT 1`, email
          )
          user = rows?.[0] || null
        } catch {}
        if (!user) return null

        return { id: user.id, email, name: "Admin" }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 1. Saat pertama kali login, simpan ID user ke token
      if (user) {
        token.sub = user.id;
      }

      if (token?.sub) {
        try {
          const rows = await prisma.$queryRawUnsafe<Array<{
            id: string; name: string | null; email: string | null;
            kuota: number; role_id: string; license_id: string;
          }>>(
            `SELECT u.id, u.name, u.email, u.kuota, u.role_id, u.license_id FROM "user" u WHERE u.id = $1 LIMIT 1`,
            token.sub
          )
          const userRow = rows?.[0]

          if (!userRow) return null

          const licRows = await prisma.$queryRawUnsafe<Array<{ name: string; features: any }>>(
            `SELECT name, features FROM license WHERE id = $1 LIMIT 1`, userRow.license_id
          )
          const licName = licRows?.[0]?.name || "Free Tier"

          token.roleId = userRow.role_id
          token.licenseObj = { id: userRow.license_id, name: licName }
          token.roleObj = { id: userRow.role_id, role: userRow.role_id === "cl-admin" ? "admin" : "user" }

          // Daily kuota reset check
          const today = new Date().toISOString().slice(0, 10)
          const lastReset = (token.kuotaDate as string) || ""
          if (lastReset !== today) {
            const dailyLimit = parseInt(licRows?.[0]?.features?.token_perhari_yang_didapat || "10", 10)
            const latestKuota = await prisma.$queryRawUnsafe<Array<{ kuota: number }>>(
              `SELECT kuota FROM "user" WHERE id = $1 LIMIT 1`, token.sub
            )
            const currentKuota = latestKuota?.[0]?.kuota ?? 0
            if (lastReset === "" || currentKuota <= 0) {
              await prisma.$executeRawUnsafe(`UPDATE "user" SET kuota = $1 WHERE id = $2`, dailyLimit, token.sub)
              token.kuota = dailyLimit
            } else {
              token.kuota = currentKuota
            }
            token.kuotaDate = today
          } else {
            token.kuota = userRow.kuota
          }
        } catch {
          // If DB query fails, continue with existing token data
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.kuota = token.kuota as number;
        session.user.roleId = token.roleId as string;
        session.user.role = token.roleObj as any;
        session.user.license = token.licenseObj as any;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO settings (id, "userId", data, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())`,
          crypto.randomUUID(), user.id, JSON.stringify({
            logo: null,
            alamat: "Jl. Raya No. 123, Kota Jakarta",
            adminFee: { type: "fixed", ranges: [], fixedValue: 2500, multiplier: { fee: 2500, step: 10000 } },
            shopName: "StrukApp Digital",
            reference: { type: "limited", digitLimit: 10 },
          })
        );

        const defaultEwallet = `[{"id":"1","type":"input_image","width":80,"height":80,"source":"logo","marginTop":0,"marginBottom":10},{"gap":4,"type":"input_text","color":"#1a1a1a","label":"NAMA TOKO","dataType":"Store_Name","position":"center","hasBorder":false,"marginTop":0,"showLabel":false,"labelLayout":"stacked","exampleValue":"NAMA TOKO ANDA","marginBottom":0,"labelFontSize":12,"valueFontSize":17,"labelFontWeight":"reg","valueFontWeight":"bold"},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"Label Baru","dataType":"Alamat_Toko","position":"center","hasBorder":false,"marginTop":0,"showLabel":false,"labelLayout":"stacked","exampleValue":"Jl. Raya No. 123, Kota Jakarta","marginBottom":6,"labelFontSize":16,"letterSpacing":-1.5,"valueFontSize":16,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1.5,"valueLetterSpacing":-1.5},{"id":"4","type":"separator","color":"#333333","style":"double_dash","marginTop":5,"thickness":2,"marginBottom":8},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"TANGGAL","dataType":"Date","position":"default","marginTop":0,"showLabel":true,"labelLayout":"inline","exampleValue":"2026-05-15","marginBottom":0,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1.5,"valueLetterSpacing":-1.5},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"WAKTU","dataType":"Time","position":"default","marginTop":2,"showLabel":true,"labelLayout":"inline","exampleValue":"22:56 WIB","marginBottom":6,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-2,"valueLetterSpacing":-1.7},{"id":"15","type":"separator","color":"#333333","style":"dash","marginTop":8,"marginBottom":10},{"gap":2,"type":"input_text","color":"#1a1a1a","label":"KODE REFERENSI","dataType":"Referensi","position":"center","hasBorder":false,"marginTop":0,"showLabel":true,"labelLayout":"stacked","exampleValue":"343667317054","marginBottom":10,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":16,"labelFontWeight":"semi","valueFontWeight":"bold","valueLetterSpacing":-1.5},{"id":"7","type":"separator","color":"#333333","style":"dash","marginTop":5,"marginBottom":5},{"id":"8","type":"text","color":"#1a1a1a","value":"DATA PENERIMA","fontSize":16,"alignment":"center","marginTop":0,"fontWeight":"bold","marginBottom":0},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"E-WALLET","dataType":"String","position":"default","marginTop":0,"showLabel":true,"labelLayout":"inline","exampleValue":"BCA","marginBottom":2,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1,"valueLetterSpacing":-1},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"NO. HP","dataType":"String","position":"default","marginTop":0,"showLabel":true,"labelLayout":"inline","exampleValue":"1234567890","marginBottom":2,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1,"valueLetterSpacing":-1.4},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"NAMA","dataType":"String","position":"default","marginTop":0,"showLabel":true,"labelLayout":"inline","exampleValue":"FAHMY BIMA","marginBottom":2,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1,"valueLetterSpacing":-1.4},{"id":"18","type":"separator","color":"#333333","style":"dash","marginTop":10,"marginBottom":10},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"NOMINAL","dataType":"Nominal","position":"default","marginTop":0,"showLabel":true,"labelLayout":"inline","exampleValue":"Rp 1.000.000","marginBottom":0,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1,"valueLetterSpacing":-2},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"ADMIN","dataType":"Admin_Fee","position":"default","hasBorder":false,"marginTop":3,"showLabel":true,"labelLayout":"inline","exampleValue":"Rp 2.500","marginBottom":0,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"reg","valueFontWeight":"reg","labelLetterSpacing":-1,"valueLetterSpacing":-2},{"id":"61709629-8d6c-4c6e-833f-ea1a83601c16","type":"separator","color":"#333333","style":"dash","marginTop":10,"marginBottom":10},{"gap":12,"type":"input_text","color":"#1a1a1a","label":"TOTAL","dataType":"total_keseluruhan","position":"default","hasBorder":false,"marginTop":0,"showLabel":true,"labelLayout":"inline","exampleValue":"Rp 2.500","marginBottom":6,"labelFontSize":15,"letterSpacing":-1,"valueFontSize":15,"labelFontWeight":"bold","valueFontWeight":"bold","labelLetterSpacing":-1,"valueLetterSpacing":-2},{"id":"4a3e3551-76a3-429b-8016-2beb0614058e","type":"separator","color":"#333333","style":"double_dash","marginTop":10,"marginBottom":30},{"id":"bdacd5e6-88b1-4f4e-a83e-13afae1fe73f","type":"separator","color":"#333333","style":"dash","marginTop":10,"thickness":2,"marginBottom":10},{"id":"aa7c1f00-2ada-43d8-9184-51e50c83efef","type":"text","color":"#1a1a1a","value":"** TRANSAKSI BERHASIL **","fontSize":17,"alignment":"center","marginTop":5,"fontWeight":"semi","marginBottom":0,"letterSpacing":-2.4},{"id":"964ba5f3-27a5-4b49-8b53-d83bd673dc3d","type":"text","color":"#1a1a1a","value":"SALINAN - VIA STRUKAPP","fontSize":16,"alignment":"center","marginTop":3,"fontWeight":"reg","marginBottom":0,"letterSpacing":-1.3},{"id":"598fe630-113a-4ce9-832d-a60c27fa4329","type":"text","color":"#1a1a1a","value":"TERIMA KASIH","fontSize":16,"alignment":"center","marginTop":3,"fontWeight":"bold","marginBottom":40,"letterSpacing":0}]`;

        const defaultListrik = defaultEwallet.replace('"E-WALLET"', '"NO. METER"').replace('"BCA"', '"1234567890"').replace('"String"', '"String"');

        await prisma.$executeRawUnsafe(
          `INSERT INTO layouts (id, name, "userId", config, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
          crypto.randomUUID(), "Layout E-Wallet Default", user.id, defaultEwallet
        );
        await prisma.$executeRawUnsafe(
          `INSERT INTO layouts (id, name, "userId", config, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
          crypto.randomUUID(), "Layout Token Listrik Default", user.id, defaultListrik
        );
      } catch (error) {
        console.error("Gagal membuat settings default:", error);
      }
    }
  },
})