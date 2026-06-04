import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

        const adminHash = "$2b$10$FT1prq.8MtNKI965.ZUTZOzHTJfE18iVZa1BhbHoIpb4C8FmL5vSm"
        const correct = await bcrypt.compare(password, adminHash)
        if (!correct) return null

        if (email !== "abdil150507@gmail.com") return null
        return { id: "admin-001", email, name: "Admin" }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 1. Saat pertama kali login, simpan ID user ke token
      if (user) {
        token.sub = user.id;
      }

      // 2. Tarik data user lengkap beserta objek relasi RolesUser dari DB
      if (token?.sub) {
        try {
          const rows = await prisma.$queryRawUnsafe<Array<{
            id: string; name: string | null; email: string | null;
            kuota: number; role_id: string; license: string;
          }>>(
            `SELECT id, name, email, kuota, role_id, license FROM "user" WHERE id = $1 LIMIT 1`,
            token.sub
          )
          const userRow = rows?.[0]

          // Jika user dihapus dari database oleh admin, hancurkan session
          if (!userRow) return null

          token.kuota = userRow.kuota
          token.roleId = userRow.role_id
          token.licenseObj = { id: userRow.license, license: userRow.license }
          token.roleObj = { id: userRow.role_id, role: userRow.role_id === "cl-admin" ? "admin" : "user" }
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