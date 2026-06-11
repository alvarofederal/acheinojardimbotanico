import NextAuth, { DefaultSession, type User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import prisma from "./prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter, AdapterUser } from "next-auth/adapters"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"

// Resiliência de config: em produção, se AUTH_URL não veio do painel do host,
// usa o domínio canônico. O OAuth (Google) exige redirect https no domínio
// público — atrás do proxy da Hostinger o host visto pelo app é 0.0.0.0:3000,
// então sem isso o redirect sai errado. Definido no código = ninguém precisa
// (nem pode errar ao) configurar no painel.
if (process.env.NODE_ENV === "production" && !process.env.AUTH_URL?.trim()) {
  process.env.AUTH_URL = "https://www.acheinojardimbotanico.com.br"
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}

function customAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p)

  return {
    ...baseAdapter,

    async getUserByAccount(account) {
      const dbAccount = await p.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: { user: true },
      })

      if (!dbAccount) return null

      if (!dbAccount.user) {
        await p.account.delete({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        })
        return null
      }

      return dbAccount.user as unknown as AdapterUser
    },

    async getUserByEmail(email) {
      const user = await p.user.findUnique({ where: { email } })
      if (!user) return null
      return user as unknown as AdapterUser
    },

    async linkAccount(account) {
      const existing = await p.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
      })

      if (existing) return

      await p.account.create({ data: account })

      await p.user.update({
        where: { id: account.userId },
        data: { emailVerified: new Date() },
      })
    },

    async createSession(session) {
      return p.session.create({ data: session })
    },

    async getSessionAndUser(sessionToken) {
      const result = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      if (!result) return null

      const { user, ...session } = result
      return { user: user as unknown as AdapterUser, session }
    },

    async updateSession(session) {
      return p.session.update({
        where: { sessionToken: session.sessionToken! },
        data: session,
      })
    },

    async deleteSession(sessionToken) {
      await p.session.delete({ where: { sessionToken } })
    },
  } as Adapter
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: customAdapter(prisma),
  trustHost: true,

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.username as string },
        })

        if (!user || !user.passwordHash) return null

        if (!user.active) {
          throw new Error("ACCOUNT_DISABLED")
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        } as User
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })

        session.user.role = dbUser?.role ?? "VISITOR"
      }

      return session
    },

    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (existingUser) {
          if (!existingUser.active) return false // conta desativada não loga via OAuth
          const updates: Record<string, unknown> = {}
          if (!existingUser.emailVerified) updates.emailVerified = new Date()
          if (!existingUser.name && user.name) updates.name = user.name
          if (!existingUser.image && user.image) updates.image = user.image
          if (Object.keys(updates).length > 0) {
            await prisma.user.update({ where: { id: existingUser.id }, data: updates })
          }
        }
      }

      return true
    },
  },

  pages: {
    signIn: "/login",
  },
})
