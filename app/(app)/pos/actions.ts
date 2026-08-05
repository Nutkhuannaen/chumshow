"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { issueStock, receiveStock, InsufficientStockError } from "@/lib/costing";
import { getOpenShift } from "@/lib/shift";
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

function parseCartLines(formData: FormData) {
  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const lines: { productId: string; quantity: number }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    const parsed = lineSchema.safeParse({ productId: productIds[i], quantity: quantities[i] });
    if (!parsed.success) return null;
    lines.push(parsed.data);
  }
  return lines;
}

async function issueLinesAndBuildItems(
  tx: Prisma.TransactionClient,
  lines: { productId: string; quantity: number }[],
  saleId: string,
) {
  const products = await tx.product.findMany({ where: { id: { in: lines.map((l) => l.productId) } } });
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

  for (const line of lines) {
    const product = productById.get(line.productId);
    if (!product) throw new Error("ไม่พบสินค้าในตะกร้า");

    const { unitCostUsed } = await issueStock(tx, {
      productId: line.productId,
      quantity: line.quantity,
      type: "SALE_OUT",
      sourceType: "SALE",
      sourceId: saleId,
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

  return { itemsData, subtotal };
}

export async function checkout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const shift = await getOpenShift();
  if (!shift) return { error: "กรุณาเปิดกะก่อนเริ่มขายสินค้า" };

  const lines = parseCartLines(formData);
  if (!lines || lines.length === 0) return { error: "ตะกร้าว่าง — กรุณาเลือกสินค้า" };

  const cashReceived = Number(formData.get("cashReceived"));
  if (!Number.isFinite(cashReceived) || cashReceived < 0) {
    return { error: "กรุณากรอกจำนวนเงินที่รับ" };
  }

  let saleId: string;

  try {
    saleId = await prisma.$transaction(async (tx) => {
      const saleNumber = await nextSaleNumber(tx);
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          cashierId: session.user.id,
          shiftId: shift.id,
          paymentMethod: "CASH",
          status: "COMPLETED",
          subtotal: 0,
          total: 0,
          cashReceived,
          changeGiven: 0,
        },
      });

      const { itemsData, subtotal } = await issueLinesAndBuildItems(tx, lines, sale.id);

      const total = subtotal;
      if (cashReceived < total) throw new Error("เงินที่รับไม่พอ");
      const changeGiven = cashReceived - total;

      await tx.sale.update({
        where: { id: sale.id },
        data: { subtotal, total, changeGiven, items: { create: itemsData } },
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

export async function checkoutPromptPay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const shift = await getOpenShift();
  if (!shift) return { error: "กรุณาเปิดกะก่อนเริ่มขายสินค้า" };

  const shop = await prisma.shop.findFirst();
  if (!shop?.promptPayId) return { error: "ร้านยังไม่ได้ตั้งค่าพร้อมเพย์ — ไปที่หน้าตั้งค่า" };

  const lines = parseCartLines(formData);
  if (!lines || lines.length === 0) return { error: "ตะกร้าว่าง — กรุณาเลือกสินค้า" };

  let saleId: string;

  try {
    saleId = await prisma.$transaction(async (tx) => {
      const saleNumber = await nextSaleNumber(tx);
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          cashierId: session.user.id,
          shiftId: shift.id,
          paymentMethod: "PROMPTPAY",
          status: "PENDING_PAYMENT",
          subtotal: 0,
          total: 0,
        },
      });

      const { itemsData, subtotal } = await issueLinesAndBuildItems(tx, lines, sale.id);

      await tx.sale.update({
        where: { id: sale.id },
        data: { subtotal, total: subtotal, items: { create: itemsData } },
      });

      return sale.id;
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return { error: e.message };
    console.error(e);
    return { error: "บันทึกการขายไม่สำเร็จ กรุณาลองใหม่" };
  }

  redirect(`/pos/receipt/${saleId}`);
}

export async function confirmPromptPayPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const saleId = formData.get("saleId");
  if (typeof saleId !== "string" || !saleId) return { error: "ไม่พบรายการขาย" };

  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) return { error: "ไม่พบรายการขาย" };
  if (sale.status !== "PENDING_PAYMENT") return { error: "รายการนี้ไม่ได้อยู่ในสถานะรอชำระเงิน" };

  await prisma.sale.update({
    where: { id: saleId },
    data: { status: "COMPLETED", promptPayConfirmedAt: new Date() },
  });

  revalidatePath(`/pos/receipt/${saleId}`);
  revalidatePath("/sales");
}

export async function cancelPendingPromptPay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const saleId = formData.get("saleId");
  if (typeof saleId !== "string" || !saleId) return { error: "ไม่พบรายการขาย" };

  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) return { error: "ไม่พบรายการขาย" };
  if (sale.status !== "PENDING_PAYMENT") return { error: "รายการนี้ไม่ได้อยู่ในสถานะรอชำระเงิน" };

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await receiveStock(tx, {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCostSnapshot,
        type: "VOID_RESTOCK_IN",
        sourceType: "VOID",
        sourceId: sale.id,
      });
    }
    await tx.sale.update({
      where: { id: sale.id },
      data: { status: "VOIDED", voidedAt: new Date(), voidReason: "ยกเลิกก่อนได้รับการชำระเงิน" },
    });
  });

  revalidatePath("/sales");
  redirect("/pos");
}
