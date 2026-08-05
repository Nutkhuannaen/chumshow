"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueStock, receiveStock, InsufficientStockError } from "@/lib/costing";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

const REASONS = ["DAMAGE", "THEFT", "EXPIRED", "COUNT_CORRECTION", "OTHER"] as const;

const lineSchema = z.object({
  productId: z.string().trim().min(1),
  quantityDelta: z.coerce.number().refine((n) => n !== 0, "จำนวนต้องไม่เป็น 0"),
});

export async function createAdjustment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const reason = formData.get("reason");
  if (typeof reason !== "string" || !REASONS.includes(reason as (typeof REASONS)[number])) {
    return { error: "กรุณาเลือกเหตุผล" };
  }
  const note = (formData.get("note") as string | null)?.trim() || null;

  const productIds = formData.getAll("productId");
  const deltas = formData.getAll("quantityDelta");
  if (productIds.length === 0) return { error: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ" };

  const lines: { productId: string; quantityDelta: number }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    const parsed = lineSchema.safeParse({ productId: productIds[i], quantityDelta: deltas[i] });
    if (!parsed.success) return { error: `รายการที่ ${i + 1}: ${parsed.error.issues[0].message}` };
    lines.push(parsed.data);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          reason: reason as (typeof REASONS)[number],
          note,
          createdById: session.user.id,
        },
      });

      for (const line of lines) {
        let unitCostSnapshot;

        if (line.quantityDelta > 0) {
          const result = await receiveStock(tx, {
            productId: line.productId,
            quantity: line.quantityDelta,
            type: "ADJUST_IN",
            sourceType: "ADJUSTMENT",
            sourceId: adjustment.id,
          });
          unitCostSnapshot = result.newAvgCost;
        } else {
          const result = await issueStock(tx, {
            productId: line.productId,
            quantity: Math.abs(line.quantityDelta),
            type: "ADJUST_OUT",
            sourceType: "ADJUSTMENT",
            sourceId: adjustment.id,
          });
          unitCostSnapshot = result.unitCostUsed;
        }

        await tx.stockAdjustmentItem.create({
          data: {
            stockAdjustmentId: adjustment.id,
            productId: line.productId,
            quantityDelta: line.quantityDelta,
            unitCostSnapshot,
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return { error: e.message };
    console.error(e);
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/stock");
  revalidatePath("/stock/adjustments");
  redirect("/stock/adjustments");
}
