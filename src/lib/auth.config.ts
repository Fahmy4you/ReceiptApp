import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
  session: { strategy: "jwt", maxAge: 1 * 24 * 60 * 60, updateAge: 15 * 60 },
  trustHost: true,
  providers: [
    Google,
  ],
  callbacks: {
    // authorized({ auth, request: { nextUrl } }) {
    //   const isLoggedIn = !!auth?.user;
    //   return true;
    // },
  },
} satisfies NextAuthConfig;