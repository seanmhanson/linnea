import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeAdmin } from "@/src/util/authorizeAdmin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    /**
     * Using credentials provider for a simple password-based auth for MVP purposes. This approach is
     * vulnerable to brute-force attacks without rate limiting, but is sufficient for an MVP
     * of a single local admin's internal interface.
     *
     * TODO: replace with a more robust auth mechanism for multiple users afterward.
     */
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) =>
        authorizeAdmin(
          typeof credentials?.password === "string" ? credentials.password : undefined
        ),
    }),
  ],
  secret: process.env.AUTH_SECRET,
});
