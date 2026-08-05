"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOpenShift } from "@/lib/shift";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

const drawSchema = z.object({
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  method: z.enum(["CASH", "TRANSFER"]),
  reason: z.string().trim().optional(),
});

export async function createOwnerDraw(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const parsed = drawSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const shift = data.method === "CASH" ? await getOpenShift() : null;

  await prisma.ownerDraw.create({
    data: {
      amount: data.amount,
      method: data.method,
      reason: data.reason || null,
      shiftId: shift?.id ?? null,
      takenById: session.user.id,
    },
  });

  revalidatePath("/finance/owner-draws");
}
