"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string } | undefined;

const nameSchema = z.string().trim().min(1, "กรุณากรอกชื่อหมวดหมู่");

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await prisma.category.findUnique({ where: { name: parsed.data } });
  if (existing) return { error: "มีหมวดหมู่นี้อยู่แล้ว" };

  await prisma.category.create({ data: { name: parsed.data } });
  revalidatePath("/stock/categories");
  revalidatePath("/stock/products/new");
}

export async function deleteCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) return { error: "ไม่พบหมวดหมู่" };

  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return { error: "ลบไม่ได้ เพราะยังมีสินค้าอยู่ในหมวดหมู่นี้" };
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/stock/categories");
}
