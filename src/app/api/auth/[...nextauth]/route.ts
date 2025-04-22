export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { compare } from "bcrypt"

export const runtime = 'nodejs'

// Define custom session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

// Dummy user data (since PostgreSQL has been removed)
const dummyUsers = [
  {
    id: "1",
    email: "user@example.com",
    name: "Demo User",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    password: "$2b$10$8jBGEH5zNSiEh0UR/Lx6/.jTV3xYI2OCEq5q9qZI32qTDr/gQGtAC" // Hashed version of "password123"
  }
];

const handler = NextAuth({
  // No adapter - using JWT strategy only
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Use dummy data instead of Prisma
        const user = dummyUsers.find(u => u.email === credentials.email);

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
})

export { handler as GET, handler as POST }
