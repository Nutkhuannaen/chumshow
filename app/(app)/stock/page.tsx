import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StockPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { category: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-stone-900">สต็อกสินค้า</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/stock/categories"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
          >
            หมวดหมู่
          </Link>
          <Link
            href="/stock/in"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
          >
            รับสินค้าเข้า
          </Link>
          <Link
            href="/stock/adjustments"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
          >
            ปรับปรุงสต็อก
          </Link>
          <Link
            href="/stock/products/new"
            className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            + เพิ่มสินค้า
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">สินค้า</th>
              <th className="px-4 py-2 font-medium">หมวดหมู่</th>
              <th className="px-4 py-2 font-medium text-right">คงเหลือ</th>
              <th className="px-4 py-2 font-medium text-right">ต้นทุนเฉลี่ย/หน่วย</th>
              <th className="px-4 py-2 font-medium text-right">ราคาขาย</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  ยังไม่มีสินค้า — เริ่มจาก &quot;เพิ่มสินค้า&quot;
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const low = p.currentStock.lte(p.reorderPoint);
                return (
                  <tr key={p.id} className={!p.isActive ? "opacity-40" : undefined}>
                    <td className="px-4 py-2">
                      <Link href={`/stock/products/${p.id}/edit`} className="font-medium text-stone-800 hover:underline">
                        {p.name}
                      </Link>
                      {p.sku && <div className="text-xs text-stone-400">SKU: {p.sku}</div>}
                    </td>
                    <td className="px-4 py-2 text-stone-500">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={low ? "font-medium text-red-600" : "text-stone-800"}>
                        {p.currentStock.toString()} {p.unit}
                      </span>
                      {low && (
                        <div className="text-xs text-red-500">ใกล้หมด (จุดสั่งซื้อ {p.reorderPoint.toString()})</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-stone-600">฿{p.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-stone-800">฿{p.sellPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/stock/products/${p.id}/edit`} className="text-xs text-stone-500 hover:underline">
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
