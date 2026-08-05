import { Prisma } from "@/app/generated/prisma/client";
import type { StockMovementType, StockSourceType } from "@/app/generated/prisma/client";

const { Decimal } = Prisma;
type DecimalValue = string | number | Prisma.Decimal;

export class InsufficientStockError extends Error {
  constructor(
    public productId: string,
    public productName: string,
    public available: Prisma.Decimal,
    public requested: Prisma.Decimal,
    public unit: string,
  ) {
    super(`สินค้าไม่พอ — ${productName} เหลือ ${available.toString()} ${unit}`);
    this.name = "InsufficientStockError";
  }
}

async function lockProduct(tx: Prisma.TransactionClient, productId: string) {
  const rows = await tx.$queryRaw<
    { id: string; name: string; unit: string; currentStock: Prisma.Decimal; costPrice: Prisma.Decimal }[]
  >`SELECT id, name, unit, "currentStock", "costPrice" FROM "Product" WHERE id = ${productId} FOR UPDATE`;
  const row = rows[0];
  if (!row) throw new Error(`ไม่พบสินค้า: ${productId}`);
  return row;
}

/**
 * Receives stock into a product (purchase, count-up adjustment, or a void's restock).
 * Recomputes the weighted-average unit cost: (existing qty * existing avg cost + incoming qty * incoming cost) / new qty.
 */
export async function receiveStock(
  tx: Prisma.TransactionClient,
  params: {
    productId: string;
    quantity: DecimalValue;
    /** Omit to value the incoming quantity at the product's current average cost (e.g. a count-up adjustment). */
    unitCost?: DecimalValue;
    type: Extract<StockMovementType, "PURCHASE_IN" | "ADJUST_IN" | "VOID_RESTOCK_IN">;
    sourceType: StockSourceType;
    sourceId: string;
    note?: string;
  },
) {
  const product = await lockProduct(tx, params.productId);
  const quantity = new Decimal(params.quantity);
  const unitCost = params.unitCost === undefined ? product.costPrice : new Decimal(params.unitCost);

  const newQty = product.currentStock.add(quantity);
  const existingValue = product.currentStock.mul(product.costPrice);
  const incomingValue = quantity.mul(unitCost);
  const newAvgCost = newQty.isZero() ? new Decimal(0) : existingValue.add(incomingValue).div(newQty);

  await tx.product.update({
    where: { id: params.productId },
    data: { currentStock: newQty, costPrice: newAvgCost },
  });

  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      type: params.type,
      quantity,
      unitCost,
      qtyBalanceAfter: newQty,
      avgCostBalanceAfter: newAvgCost,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      note: params.note,
    },
  });

  return { newQty, newAvgCost };
}

/**
 * Issues stock out of a product (sale, shrinkage/write-off adjustment).
 * Cost basis is the CURRENT weighted-average cost at the moment of removal — issuing stock
 * never changes the average cost, only receiving does. Throws if the product doesn't have enough.
 */
export async function issueStock(
  tx: Prisma.TransactionClient,
  params: {
    productId: string;
    quantity: DecimalValue;
    type: Extract<StockMovementType, "SALE_OUT" | "ADJUST_OUT">;
    sourceType: StockSourceType;
    sourceId: string;
    note?: string;
    allowNegative?: boolean;
  },
) {
  const product = await lockProduct(tx, params.productId);
  const quantity = new Decimal(params.quantity);

  if (!params.allowNegative && quantity.gt(product.currentStock)) {
    throw new InsufficientStockError(
      product.id,
      product.name,
      product.currentStock,
      quantity,
      product.unit,
    );
  }

  const newQty = product.currentStock.sub(quantity);
  const unitCostUsed = product.costPrice;

  await tx.product.update({
    where: { id: params.productId },
    data: { currentStock: newQty },
  });

  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      type: params.type,
      quantity,
      unitCost: unitCostUsed,
      qtyBalanceAfter: newQty,
      avgCostBalanceAfter: unitCostUsed,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      note: params.note,
    },
  });

  return { newQty, unitCostUsed };
}
