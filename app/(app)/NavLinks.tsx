"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const STAFF_NAV: NavItem[] = [
  { href: "/pos", label: "ขายสินค้า" },
  { href: "/sales", label: "ประวัติการขาย" },
  { href: "/stock", label: "สต็อกสินค้า" },
  { href: "/shift", label: "กะการทำงาน" },
];

const OWNER_NAV: NavItem[] = [
  { href: "/dashboard", label: "ภาพรวมร้าน" },
  { href: "/finance/expenses", label: "ค่าใช้จ่าย" },
  { href: "/finance/owner-draws", label: "เบิกเงินส่วนตัว" },
  { href: "/finance/capex", label: "เงินลงทุน" },
  { href: "/settings", label: "ตั้งค่า" },
];

export function NavLinks({ role }: { role: "OWNER" | "STAFF" }) {
  const pathname = usePathname();
  const items = role === "OWNER" ? [...STAFF_NAV, ...OWNER_NAV] : STAFF_NAV;

  return (
    <nav className="flex flex-wrap gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
