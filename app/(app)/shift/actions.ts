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

export async function updateOpenShift(
  shiftId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const shift = await prisma.cashShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { error: "ไม่พบกะนี้" };
  if (shift.status !== "OPEN") return { error: "กะนี้ปิดไปแล้ว แก้ไขเงินตั้งต้นไม่ได้" };

  const parsed = z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ").safeParse(formData.get("openingCash"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.cashShift.update({
    where: { id: shiftId },
    data: { openingCash: parsed.data },
  });

  revalidatePath("/shift");
  redirect("/shift");
}

const closedShiftEditSchema = z.object({
  openingCash: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
  countedCash: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
});

export async function updateClosedShift(
  shiftId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

  const shift = await prisma.cashShift.findUnique({ where: { id: shiftId } });
  if (!shift) return { error: "ไม่พบกะนี้" };
  if (shift.status !== "CLOSED") return { error: "กะนี้ยังไม่ได้ปิด" };

  const parsed = closedShiftEditSchema.safeParse({
    openingCash: formData.get("openingCash"),
    countedCash: formData.get("countedCash"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Recompute expected cash from the (possibly corrected) opening cash plus this
  // shift's linked sales/expenses/draws — an explicit, user-initiated correction,
  // not the silent-drift scenario the freeze-at-close design otherwise guards against.
  const expectedCash = await computeExpectedCash(shiftId, parsed.data.openingCash);
  const variance = parsed.data.countedCash - expectedCash.toNumber();

  await prisma.cashShift.update({
    where: { id: shiftId },
    data: {
      openingCash: parsed.data.openingCash,
      countedCash: parsed.data.countedCash,
      expectedCash,
      variance,
    },
  });

  revalidatePath("/shift/history");
  redirect("/shift/history");
}
