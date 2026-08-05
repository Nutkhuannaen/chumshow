import { prisma } from "@/lib/prisma";
import { POSTerminal } from "./POSTerminal";

export default async function PosPage() {
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
