import { prisma } from "@/lib/prisma";
import { getShop } from "@/lib/shop";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const [shop, staff] = await Promise.all([
    getShop(),
    prisma.user.findMany({
      where: { role: "STAFF", isActive: true },
      select: { username: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900">
            {shop?.name ?? "ChumShow"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">ระบบร้านค้า POS</p>
        </div>
        <LoginForm staff={staff} />
      </div>
    </div>
  );
}
