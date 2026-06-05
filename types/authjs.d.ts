import NextAuth, { type DefaultSession } from "next-auth"


declare module "next-auth" {
  interface Session {
    user: {
      id: string
      whatsappNumber?: string | null
      kuota: number
      license: {
        id: string
        name: string
      }
      roleId: string
      lastLogin?: Date | null
      createdAt: Date
      updatedAt: Date
      role: {
        id: string
        role: string
      }
    } & DefaultSession["user"]
  }

  interface User {
    whatsappNumber?: string | null
    kuota?: number
    roleId?: string
    licenseId?: string
    lastLogin?: Date | null
    licenseEndDate?: Date | null
  }

  interface JWT {
    sub: string
    whatsappNumber?: string | null
    kuota?: number
    kuotaDate?: string
    roleId?: string
    roleObj?: {
      id: string
      role: string
    }
  }
}