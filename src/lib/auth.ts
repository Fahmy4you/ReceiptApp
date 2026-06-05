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

          token.roleId = userRow.role_id
          token.licenseObj = { id: userRow.license_id, license: userRow.license_id }
          token.roleObj = { id: userRow.role_id, role: userRow.role_id === "cl-admin" ? "admin" : "user" }

          // Daily kuota reset check
          const today = new Date().toISOString().slice(0, 10)
          const lastReset = (token.kuotaDate as string) || ""
          if (lastReset !== today) {
            const licRows = await prisma.$queryRawUnsafe<Array<{ features: any }>>(
              `SELECT features FROM license WHERE id = $1 LIMIT 1`, userRow.license_id
            )
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
})