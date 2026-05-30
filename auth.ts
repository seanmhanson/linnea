import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeAdmin } from "@/src/util/authorizeAdmin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) =>
        authorizeAdmin(credentials?.password as string | undefined),
    }),
  ],
  secret: process.env.AUTH_SECRET,
});
