import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdjustmentForm } from "./AdjustmentForm";

const REASON_LABELS: Record<string, string> = {
  DAMAGE: "สินค้าเสียหาย",
  THEFT: "สูญหาย/ถูกขโมย",
  EXPIRED: "หมดอายุ",
  COUNT_CORRECTION: "นับสต็อกจริงไม่ตรง",
  OTHER: "อื่นๆ",
};

export default async function AdjustmentsPage() {
  const [products, adjustments] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, currentStock: true },
    }),
    prisma.stockAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true, unit: true } } } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">ปรับปรุงสต็อก</h1>
        <Link href="/stock" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าสต็อก
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          ยังไม่มีสินค้า — ไปที่ &quot;เพิ่มสินค้า&quot; ก่อน
        </p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <AdjustmentForm
            products={products.map((p) => ({ ...p, currentStock: p.currentStock.toString() }))}
          />
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-stone-700">ประวัติการปรับปรุงล่าสุด</h2>
        {adjustments.length === 0 ? (
          <p className="text-sm text-stone-400">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-3">
            {adjustments.map((a) => (
              <div key={a.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium text-stone-800">{REASON_LABELS[a.reason] ?? a.reason}</span>
                    <span className="ml-2 text-stone-400">
                      {a.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <span className="ml-2 text-stone-400">โดย {a.createdBy.name}</span>
                  </div>
                </div>
                <ul className="space-y-0.5 text-xs text-stone-500">
                  {a.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name}: {item.quantityDelta.gt(0) ? "+" : ""}
                      {item.quantityDelta.toString()} {item.product.unit}
                    </li>
                  ))}
                </ul>
                {a.note && <p className="mt-2 text-xs text-stone-400">หมายเหตุ: {a.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
