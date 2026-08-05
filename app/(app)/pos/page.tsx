import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOpenShift } from "@/lib/shift";
import { POSTerminal } from "./POSTerminal";

export default async function PosPage() {
  const shift = await getOpenShift();

  if (!shift) {
    return (
      <div className="mx-auto max-w-sm rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <p className="mb-4 text-sm text-stone-600">ต้องเปิดกะก่อนถึงจะเริ่มขายสินค้าได้</p>
        <Link
          href="/shift"
          className="inline-block rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          ไปเปิดกะ
        </Link>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { category: true },
  });

  return (
    <POSTerminal
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        sellPrice: p.sellPrice.toNumber(),
        currentStock: p.currentStock.toNumber(),
        barcode: p.barcode,
        sku: p.sku,
        categoryName: p.category?.name ?? null,
      }))}
    />
  );
}
