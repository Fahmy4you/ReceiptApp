import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { DEFAULT_SETTINGS_FIRST_LOGIN, DefaultEwalletLayout, DefaultListrikLayout } from "@/lib/constanta"
import { authConfig } from "@/lib/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, 
  adapter: PrismaAdapter(prisma), 
  callbacks: {
    async jwt({ token, user }) {
      // 1. Saat pertama kali login, simpan ID user ke token
      if (user) {
        token.sub = user.id;
      }

      // 2. Tarik data user lengkap beserta objek relasi RolesUser dari DB
      if (token?.sub) {
        const userWithRole = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { 
            role: true,
            license: true
          },
        });

        // Jika user dihapus dari database oleh admin, hancurkan session
        if (!userWithRole) {
          return null; 
        }

        // 3. Rekam semua data dari database ke dalam Token JWT
        token.whatsappNumber = userWithRole.whatsappNumber;
        token.kuota = userWithRole.kuota;
        token.roleId = userWithRole.roleId;
        token.licenseId = userWithRole.license_id;
        token.licenseEndDate = userWithRole.licenseEndDate;

        token.roleObj = userWithRole.role ? {
          id: userWithRole.role.id,
          role: userWithRole.role.role || "user"
        } : { id: "cl-user", role: "user" };
        token.licenseObj = userWithRole.license ? {
          id: userWithRole.license.id,
          license: userWithRole.license.name || "Free Tier"
        } : { id: "l-free-tier", license: "Free Tier" };
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        // 4. Pindahkan semua data dari token JWT ke dalam session.user frontend
        session.user.id = token.sub as string;
        session.user.whatsappNumber = token.whatsappNumber as string | null;
        session.user.kuota = token.kuota as number;
        session.user.roleId = token.roleId as string;
        session.user.licenseId = token.licenseId as string;
        session.user.licenseEndDate = token.licenseEndDate as Date | null;
        session.user.role = token.roleObj as any;
        session.user.license = token.licenseObj as any;
      } else {
        return null as any;
      }
      
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        await prisma.settings.create({
          data: {
            userId: user.id,
            data: DEFAULT_SETTINGS_FIRST_LOGIN as any
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
      } catch (error) {
        console.error("Gagal membuat settings default:", error);
      }
    }
  }
})