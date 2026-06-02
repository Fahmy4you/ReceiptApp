import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Perbarui tipe data role di sini menjadi bentuk Objek
      role: {
        id: string;
        role: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    roleId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleObj?: {
      id: string;
      role: string;
    };
  }
}