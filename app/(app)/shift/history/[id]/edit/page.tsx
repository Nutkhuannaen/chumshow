import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeExpectedCash } from "@/lib/shift";
import { EditClosedShiftForm } from "./EditClosedShiftForm";

export default async function EditClosedShiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shift = await prisma.cashShift.findUnique({ where: { id } });
  if (!shift || shift.status !== "CLOSED") notFound();

  // The portion of expectedCash that comes purely from this shift's linked
  // cash sales/expenses/draws, independent of the opening float — lets the
  // edit form recompute expectedCash live as the opening cash is corrected.
  const cashMovementsSum = await computeExpectedCash(shift.id, 0);

  return (
    <div className="max-w-sm space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">แก้ไขกะที่ปิดแล้ว</h1>
        <Link href="/shift/history" className="text-sm text-stone-500 hover:underline">
          ← กลับ
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <EditClosedShiftForm
          shiftId={shift.id}
          initialOpeningCash={shift.openingCash.toString()}
          initialCountedCash={shift.countedCash?.toString() ?? "0"}
          cashMovementsSum={cashMovementsSum.toNumber()}
        />
      </div>
    </div>
  );
}
