"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { receiveStock } from "@/lib/costing";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

const lineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().positive("จำนวนต้องมากกว่า 0"),
  unitCost: z.coerce.number().min(0, "ต้นทุนต้องไม่ติดลบ"),
});

export async function createStockIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const supplierName = (formData.get("supplierName") as string | null)?.trim() || null;
  const note = (formData.get("note") as string | null)?.trim() || null;

  const productIds = formData.getAll("productId");
  const quantities = formData.getAll("quantity");
  const unitCosts = formData.getAll("unitCost");

  if (productIds.length === 0) return { error: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ" };

  const lines: { productId: string; quantity: number; unitCost: number }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    const parsed = lineSchema.safeParse({
      productId: productIds[i],
      quantity: quantities[i],
      unitCost: unitCosts[i],
    });
    if (!parsed.success) return { error: `รายการที่ ${i + 1}: ${parsed.error.issues[0].message}` };
    lines.push(parsed.data);
  }

  const totalCost = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  try {
    await prisma.$transaction(async (tx) => {
      const stockIn = await tx.stockIn.create({
        data: {
          supplierName,
          note,
          totalCost,
          createdById: session.user.id,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitCost: l.unitCost,
              subtotal: l.quantity * l.unitCost,
            })),
          },
        },
      });

      for (const line of lines) {
        await receiveStock(tx, {
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          type: "PURCHASE_IN",
          sourceType: "STOCK_IN",
          sourceId: stockIn.id,
        });
      }
    });
  } catch (e) {
    console.error(e);
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }

  revalidatePath("/stock");
  revalidatePath("/stock/in/history");
  redirect("/stock/in/history");
}
