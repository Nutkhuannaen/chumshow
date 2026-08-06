import Link from "next/link";
import { getOpenShift, computeExpectedCash } from "@/lib/shift";
import { DeleteButton } from "@/app/(app)/DeleteButton";
import { OpenShiftForm } from "./OpenShiftForm";
import { deleteShift } from "./actions";

export default async function ShiftPage() {
  const shift = await getOpenShift();

  if (!shift) {
    return (
      <div className="max-w-sm space-y-4">
        <h1 className="text-lg font-semibold text-stone-900">เปิดกะการทำงาน</h1>
        <p className="text-sm text-stone-500">
          ต้องเปิดกะก่อนถึงจะเริ่มขายสินค้าได้ — เพื่อให้นับเงินสดในลิ้นชักได้ถูกต้องตอนปิดร้าน
        </p>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <OpenShiftForm />
        </div>
        <Link href="/shift/history" className="block text-center text-sm text-stone-500 hover:underline">
          ประวัติกะที่ผ่านมา
        </Link>
      </div>
    );
  }

  const expectedCash = await computeExpectedCash(shift.id, shift.openingCash);

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">กะที่กำลังเปิดอยู่</h1>
      <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm">
        <div className="mb-3 flex justify-between">
          <span className="text-stone-500">เปิดโดย</span>
          <span className="text-stone-800">{shift.openedBy.name}</span>
        </div>
        <div className="mb-3 flex justify-between">
          <span className="text-stone-500">เวลาที่เปิด</span>
          <span className="text-stone-800">
            {shift.openedAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-stone-500">เงินสดตั้งต้น</span>
          <span className="flex items-center gap-2">
            <span className="text-stone-800">฿{shift.openingCash.toFixed(2)}</span>
            <Link href="/shift/edit" className="text-xs text-stone-400 hover:underline">
              แก้ไข
            </Link>
            <DeleteButton action={deleteShift.bind(null, shift.id)} />
          </span>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-3 font-semibold">
          <span className="text-stone-600">เงินสดที่ควรมีตอนนี้</span>
          <span className="text-stone-900">฿{expectedCash.toFixed(2)}</span>
        </div>
      </div>
      <Link
        href="/shift/close"
        className="block w-full rounded-xl bg-stone-900 py-3 text-center text-sm font-semibold text-white"
      >
        ปิดกะ
      </Link>
      <Link href="/shift/history" className="block text-center text-sm text-stone-500 hover:underline">
        ประวัติกะที่ผ่านมา
      </Link>
    </div>
  );
}
