import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifySecret } from "@/lib/password";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "owner",
      name: "Owner",
      credentials: { username: {}, password: {} },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.isActive || user.role !== "OWNER" || !user.passwordHash) {
          return null;
        }
        const valid = await verifySecret(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
    Credentials({
      id: "staff",
      name: "Staff",
      credentials: { username: {}, pin: {} },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const pin = credentials?.pin as string | undefined;
        if (!username || !pin) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.isActive || user.role !== "STAFF" || !user.pinHash) {
          return null;
        }
        const valid = await verifySecret(pin, user.pinHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
});
