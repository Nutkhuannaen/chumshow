import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StockInHistoryPage() {
  const stockIns = await prisma.stockIn.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      createdBy: { select: { name: true } },
      items: { include: { product: { select: { name: true, unit: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">ประวัติการรับสินค้าเข้า</h1>
        <Link href="/stock/in" className="text-sm text-stone-500 hover:underline">
          + รับสินค้าเข้าใหม่
        </Link>
      </div>

      {stockIns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          ยังไม่มีประวัติการรับสินค้า
        </p>
      ) : (
        <div className="space-y-3">
          {stockIns.map((si) => (
            <div key={si.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium text-stone-800">
                    {si.supplierName || "ไม่ระบุผู้ขาย"}
                  </span>
                  <span className="ml-2 text-stone-400">
                    {si.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  <span className="ml-2 text-stone-400">โดย {si.createdBy.name}</span>
                </div>
                <span className="font-semibold text-stone-900">฿{si.totalCost.toFixed(2)}</span>
              </div>
              <ul className="space-y-0.5 text-xs text-stone-500">
                {si.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} — {item.quantity.toString()} {item.product.unit} ×{" "}
                    ฿{item.unitCost.toFixed(2)} = ฿{item.subtotal.toFixed(2)}
                  </li>
                ))}
              </ul>
              {si.note && <p className="mt-2 text-xs text-stone-400">หมายเหตุ: {si.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
