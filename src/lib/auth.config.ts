import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  session: { strategy: "jwt", maxAge: 1 * 24 * 60 * 60, updateAge: 15 * 60 },
  trustHost: true,
  pages: {
    signIn: "/admin-login",
  },
  providers: [],
} satisfies NextAuthConfig
