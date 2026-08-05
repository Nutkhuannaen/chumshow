import Link from "next/link";
import { redirect } from "next/navigation";
import { getOpenShift } from "@/lib/shift";
import { EditOpenShiftForm } from "./EditOpenShiftForm";

export default async function EditOpenShiftPage() {
  const shift = await getOpenShift();
  if (!shift) redirect("/shift");

  return (
    <div className="max-w-sm space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">แก้ไขเงินตั้งต้น</h1>
        <Link href="/shift" className="text-sm text-stone-500 hover:underline">
          ← กลับ
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <EditOpenShiftForm shiftId={shift.id} openingCash={shift.openingCash.toString()} />
      </div>
    </div>
  );
}
