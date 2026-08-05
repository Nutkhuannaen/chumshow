import { redirect } from "next/navigation";
import { getOpenShift, computeExpectedCash } from "@/lib/shift";
import { CloseShiftForm } from "./CloseShiftForm";

export default async function CloseShiftPage() {
  const shift = await getOpenShift();
  if (!shift) redirect("/shift");

  const expectedCash = await computeExpectedCash(shift.id, shift.openingCash);

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">ปิดกะการทำงาน</h1>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <CloseShiftForm expectedCash={expectedCash.toNumber()} />
      </div>
    </div>
  );
}
