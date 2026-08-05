"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { issueStock, InsufficientStockError } from "@/lib/costing";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

const lineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
});

async function nextSaleNumber(tx: Prisma.TransactionClient) {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const count = await tx.sale.count({ where: { createdAt: { gte: startOfDay } } });
  return `${datePart}-${String(count + 1).padStart(4, "0")}`;
}

export async function checkout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const cashReceivedRaw = formData.get("cashReceived");

  if (productIds.length === 0) return { error: "ตะกร้าว่าง — กรุณาเลือกสินค้า" };

  const lines: { productId: string; quantity: number }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    const parsed = lineSchema.safeParse({ productId: productIds[i], quantity: quantities[i] });
    if (!parsed.success) return { error: "ข้อมูลตะกร้าไม่ถูกต้อง กรุณาลองใหม่" };
    lines.push(parsed.data);
  }

  const cashReceived = Number(cashReceivedRaw);
  if (!Number.isFinite(cashReceived) || cashReceived < 0) {
    return { error: "กรุณากรอกจำนวนเงินที่รับ" };
  }

  let saleId: string;

  try {
    saleId = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: lines.map((l) => l.productId) } },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const itemsData: {
        productId: string;
        productNameSnapshot: string;
        quantity: number;
        unitPriceSnapshot: number;
        unitCostSnapshot: number;
        lineTotal: number;
        lineCogs: number;
      }[] = [];

      const saleNumber = await nextSaleNumber(tx);
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          cashierId: session.user.id,
          paymentMethod: "CASH",
          status: "COMPLETED",
          subtotal: 0,
          total: 0,
          cashReceived,
          changeGiven: 0,
        },
      });

      for (const line of lines) {
        const product = productById.get(line.productId);
        if (!product) throw new Error("ไม่พบสินค้าในตะกร้า");

        const { unitCostUsed } = await issueStock(tx, {
          productId: line.productId,
          quantity: line.quantity,
          type: "SALE_OUT",
          sourceType: "SALE",
          sourceId: sale.id,
        });

        const unitPrice = product.sellPrice.toNumber();
        const lineTotal = unitPrice * line.quantity;
        const lineCogs = unitCostUsed.toNumber() * line.quantity;
        subtotal += lineTotal;

        itemsData.push({
          productId: line.productId,
          productNameSnapshot: product.name,
          quantity: line.quantity,
          unitPriceSnapshot: unitPrice,
          unitCostSnapshot: unitCostUsed.toNumber(),
          lineTotal,
          lineCogs,
        });
      }

      const total = subtotal;
      if (cashReceived < total) {
        throw new Error("เงินที่รับไม่พอ");
      }
      const changeGiven = cashReceived - total;

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          subtotal,
          total,
          changeGiven,
          items: { create: itemsData },
        },
      });

      return sale.id;
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return { error: e.message };
    if (e instanceof Error && e.message === "เงินที่รับไม่พอ") return { error: e.message };
    console.error(e);
    return { error: "บันทึกการขายไม่สำเร็จ กรุณาลองใหม่" };
  }

  redirect(`/pos/receipt/${saleId}`);
}
