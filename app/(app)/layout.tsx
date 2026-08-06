import { auth } from "@/auth";
import { getShop } from "@/lib/shop";
import { NavLinks } from "./NavLinks";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, shop] = await Promise.all([auth(), getShop()]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">{shop?.name ?? "ChumShow"}</p>
              <p className="text-xs text-stone-500">
                {session?.user.name} · {session?.user.role === "OWNER" ? "เจ้าของร้าน" : "พนักงาน"}
              </p>
            </div>
            <form action={logout} className="sm:hidden">
              <button type="submit" className="text-xs text-stone-500 underline">
                ออกจากระบบ
              </button>
            </form>
          </div>
          <div className="flex items-center gap-3">
            <NavLinks role={session?.user.role ?? "STAFF"} />
            <form action={logout} className="hidden sm:block">
              <button type="submit" className="text-xs text-stone-500 underline whitespace-nowrap">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
