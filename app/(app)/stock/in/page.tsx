import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StockInForm } from "./StockInForm";

export default async function StockInPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, costPrice: true },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">รับสินค้าเข้า</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/stock/in/history" className="text-stone-500 hover:underline">
            ประวัติการรับสินค้า
          </Link>
          <Link href="/stock" className="text-stone-500 hover:underline">
            ← กลับไปหน้าสต็อก
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          ยังไม่มีสินค้า — ไปที่ &quot;เพิ่มสินค้า&quot; ก่อน
        </p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <StockInForm
            products={products.map((p) => ({ ...p, costPrice: p.costPrice.toFixed(2) }))}
          />
        </div>
      )}
    </div>
  );
}
