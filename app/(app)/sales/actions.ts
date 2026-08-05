"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { receiveStock } from "@/lib/costing";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

export async function voidSale(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const saleId = formData.get("saleId");
  const voidReason = (formData.get("voidReason") as string | null)?.trim() || null;
  if (typeof saleId !== "string" || !saleId) return { error: "ไม่พบรายการขาย" };

  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } });
  if (!sale) return { error: "ไม่พบรายการขาย" };
  if (sale.status === "VOIDED") return { error: "รายการนี้ถูกยกเลิกไปแล้ว" };

  const canVoid = session.user.role === "OWNER" || sale.cashierId === session.user.id;
  if (!canVoid) return { error: "คุณไม่มีสิทธิ์ยกเลิกรายการนี้" };

  try {
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
        data: { status: "VOIDED", voidedAt: new Date(), voidReason },
      });
    });
  } catch (e) {
    console.error(e);
    return { error: "ยกเลิกรายการไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/stock");
}
