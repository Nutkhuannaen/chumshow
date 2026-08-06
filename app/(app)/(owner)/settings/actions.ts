"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SHOP_CACHE_TAG } from "@/lib/shop";

export type ActionState = { error?: string; success?: boolean } | undefined;

const settingsSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อร้าน"),
  address: z.string().trim().optional(),
  promptPayId: z.string().trim().optional(),
  promptPayType: z.enum(["PHONE", "NATIONAL_ID"]).optional(),
});

export async function updateShopSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const promptPayIdRaw = (formData.get("promptPayId") as string | null)?.trim();
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    promptPayId: promptPayIdRaw || undefined,
    promptPayType: formData.get("promptPayType") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.promptPayId && !/^\d{10,13}$/.test(data.promptPayId)) {
    return { error: "หมายเลขพร้อมเพย์ต้องเป็นตัวเลข 10-13 หลัก (เบอร์โทรหรือเลขบัตรประชาชน)" };
  }

  const shop = await prisma.shop.findFirst();
  const payload = {
    name: data.name,
    address: data.address || null,
    promptPayId: data.promptPayId || null,
    promptPayType: data.promptPayId ? (data.promptPayType ?? "PHONE") : null,
  };

  if (shop) {
    await prisma.shop.update({ where: { id: shop.id }, data: payload });
  } else {
    await prisma.shop.create({ data: payload });
  }

  revalidateTag(SHOP_CACHE_TAG, "max");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}
