"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeExpectedCash, getOpenShift } from "@/lib/shift";
import { auth } from "@/auth";

export type ActionState = { error?: string } | undefined;

export async function openShift(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const existing = await getOpenShift();
  if (existing) return { error: "มีกะที่เปิดอยู่แล้ว" };

  const parsed = z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ").safeParse(formData.get("openingCash"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.cashShift.create({
    data: { openedById: session.user.id, openingCash: parsed.data },
  });

  revalidatePath("/shift");
  redirect("/pos");
}

export async function closeShift(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const shift = await getOpenShift();
  if (!shift) return { error: "ไม่มีกะที่เปิดอยู่" };

  const parsed = z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ").safeParse(formData.get("countedCash"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const expectedCash = await computeExpectedCash(shift.id, shift.openingCash);
  const countedCash = parsed.data;
  const variance = countedCash - expectedCash.toNumber();

  await prisma.cashShift.update({
    where: { id: shift.id },
    data: {
      status: "CLOSED",
      closedById: session.user.id,
      closedAt: new Date(),
      expectedCash,
      countedCash,
      variance,
    },
  });

  revalidatePath("/shift");
  revalidatePath("/shift/history");
  redirect("/shift/history");
}
