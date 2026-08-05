import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config: no Prisma / database imports here.
// middleware/proxy runs on the Edge runtime and only needs to read the JWT session cookie —
// it must never pull in the Credentials providers (which touch Prisma + pg) or the app breaks.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
