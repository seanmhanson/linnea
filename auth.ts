import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeAdmin } from "@/src/util/authorizeAdmin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    /**
     * Using credentials provider for a simple password-based auth for MVP purposes, and is
     * vulnerable to rate-limiting and brute-force attacks, but is sufficient for an MVP
     * of a singe local admin's internal interface
     *
     * TODO: replace with a more robust auth mechanism for multiple users and hashing/sessions afterward
     */
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) => authorizeAdmin(credentials?.password as string | undefined),
    }),
  ],
  secret: process.env.AUTH_SECRET,
});
