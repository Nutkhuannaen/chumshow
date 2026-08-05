"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

const capexSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อรายการ"),
  categoryLabel: z.string().trim().optional(),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  purchaseDate: z.string().min(1, "กรุณาเลือกวันที่ซื้อ"),
  usefulLifeMonths: z.coerce.number().int().positive().optional(),
  note: z.string().trim().optional(),
});

export async function createCapexItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const usefulLifeRaw = formData.get("usefulLifeMonths");
  const parsed = capexSchema.safeParse({
    name: formData.get("name"),
    categoryLabel: formData.get("categoryLabel") || undefined,
    amount: formData.get("amount"),
    purchaseDate: formData.get("purchaseDate"),
    usefulLifeMonths: usefulLifeRaw ? usefulLifeRaw : undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  await prisma.capexItem.create({
    data: {
      name: data.name,
      categoryLabel: data.categoryLabel || null,
      amount: data.amount,
      purchaseDate: new Date(data.purchaseDate),
      usefulLifeMonths: data.usefulLifeMonths ?? null,
      note: data.note || null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/finance/capex");
  revalidatePath("/dashboard");
}
