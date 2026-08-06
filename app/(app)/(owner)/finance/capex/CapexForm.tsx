"use client";

import { useActionState } from "react";
import { createCapexItem, type ActionState } from "./actions";

type CapexFormValues = {
  name: string;
  categoryLabel: string;
  amount: string;
  purchaseDate: string;
  usefulLifeMonths: string;
  note: string;
};

export function CapexForm({
  action = createCapexItem,
  initialValues,
  submitLabel = "บันทึกรายการลงทุน",
}: {
  action?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: CapexFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">ชื่อรายการ</label>
          <input
            name="name"
            required
            placeholder="เช่น ตู้แช่เย็น, ชั้นวางสินค้า"
            defaultValue={initialValues?.name}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">หมวด (ไม่บังคับ)</label>
          <input
            name="categoryLabel"
            placeholder="อุปกรณ์ / ตกแต่งร้าน / อื่นๆ"
            defaultValue={initialValues?.categoryLabel}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">จำนวนเงิน (บาท)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initialValues?.amount}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">วันที่ซื้อ</label>
          <input
            name="purchaseDate"
            type="date"
            required
            defaultValue={initialValues?.purchaseDate ?? today}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">อายุใช้งาน (เดือน, ไม่บังคับ)</label>
          <input
            name="usefulLifeMonths"
            type="number"
            step="1"
            min="1"
            placeholder="เช่น 60"
            defaultValue={initialValues?.usefulLifeMonths}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">หมายเหตุ (ไม่บังคับ)</label>
        <input
          name="note"
          defaultValue={initialValues?.note}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังบันทึก..." : submitLabel}
      </button>
    </form>
  );
}
