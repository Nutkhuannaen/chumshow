"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string } | undefined;

const productSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า"),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  unit: z.string().trim().min(1).default("ชิ้น"),
  sellPrice: z.coerce.number().min(0, "ราคาขายต้องไม่ติดลบ"),
  reorderPoint: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    unit: formData.get("unit") || "ชิ้น",
    sellPrice: formData.get("sellPrice"),
    reorderPoint: formData.get("reorderPoint") || 0,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku || null,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
        unit: data.unit,
        sellPrice: data.sellPrice,
        reorderPoint: data.reorderPoint,
        isActive: data.isActive,
      },
    });
  } catch {
    return { error: "บันทึกไม่สำเร็จ — รหัส SKU หรือบาร์โค้ดอาจซ้ำกับสินค้าอื่น" };
  }

  revalidatePath("/stock");
  redirect("/stock");
}

export async function updateProduct(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        sku: data.sku || null,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
        unit: data.unit,
        sellPrice: data.sellPrice,
        reorderPoint: data.reorderPoint,
        isActive: data.isActive,
      },
    });
  } catch {
    return { error: "บันทึกไม่สำเร็จ — รหัส SKU หรือบาร์โค้ดอาจซ้ำกับสินค้าอื่น" };
  }

  revalidatePath("/stock");
  redirect("/stock");
}
