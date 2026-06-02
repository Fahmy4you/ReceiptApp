import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { DEFAULT_SETTINGS_FIRST_LOGIN, DefaultEwalletLayout, DefaultListrikLayout } from "@/lib/constanta"
import { authConfig } from "@/lib/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, 
  adapter: PrismaAdapter(prisma), 
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id as string;
      }

      if (token?.sub) {
        // Panggilan prisma aman di sini karena file auth.ts ini 
        // tidak akan dibaca oleh middleware lagi.
        const userWithRole = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: { role: true },
        });

        if (!userWithRole) return null; 

        token.roleObj = userWithRole.role ? {
          id: userWithRole.role.id,
          role: userWithRole.role.role || "user"
        } : { id: "cl-user", role: "user" };
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        (session.user as any).role = token.roleObj;
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