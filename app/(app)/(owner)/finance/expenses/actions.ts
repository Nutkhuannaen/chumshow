"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOpenShift } from "@/lib/shift";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

export async function createExpenseCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.string().trim().min(1, "กรุณากรอกชื่อหมวดหมู่").safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.expenseCategory.findUnique({ where: { name: parsed.data } });
  if (existing) return { error: "มีหมวดหมู่นี้อยู่แล้ว" };

  await prisma.expenseCategory.create({ data: { name: parsed.data } });
  revalidatePath("/finance/expenses");
}

const expenseSchema = z.object({
  categoryId: z.string().trim().min(1, "กรุณาเลือกหมวดหมู่"),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  description: z.string().trim().optional(),
  paymentMethod: z.enum(["CASH", "TRANSFER"]),
});

export async function createExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const parsed = expenseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const shift = data.paymentMethod === "CASH" ? await getOpenShift() : null;

  await prisma.expense.create({
    data: {
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description || null,
      paymentMethod: data.paymentMethod,
      shiftId: shift?.id ?? null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/finance/expenses");
}

export async function deleteExpense(
  expenseId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  await prisma.expense.delete({ where: { id: expenseId } });

  revalidatePath("/finance/expenses");
  revalidatePath("/dashboard");
}

export async function updateExpense(
  expenseId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const parsed = expenseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  // shiftId is intentionally left untouched — it reflects which shift's cash
  // reconciliation this expense originally counted against.
  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description || null,
      paymentMethod: data.paymentMethod,
    },
  });

  revalidatePath("/finance/expenses");
}
