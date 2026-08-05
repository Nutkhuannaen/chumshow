"use client";

import { useActionState } from "react";
import { createOwnerDraw, type ActionState } from "./actions";

type OwnerDrawFormValues = {
  amount: string;
  method: "CASH" | "TRANSFER";
  reason: string;
};

export function OwnerDrawForm({
  action = createOwnerDraw,
  initialValues,
  submitLabel = "บันทึกการเบิกเงิน",
}: {
  action?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: OwnerDrawFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        นี่ไม่ใช่ค่าใช้จ่ายร้าน แต่เป็นเงินส่วนตัวที่เจ้าของถอนออกจากร้าน — บันทึกไว้เพื่อแยกเงินร้านกับเงินส่วนตัวให้ชัดเจน
      </p>
      <div className="grid grid-cols-2 gap-3">
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
          <label className="mb-1 block text-sm font-medium text-stone-700">เบิกด้วย</label>
          <div className="flex gap-4 pt-2 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="method"
                value="CASH"
                defaultChecked={(initialValues?.method ?? "CASH") === "CASH"}
              />{" "}
              เงินสด
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="method"
                value="TRANSFER"
                defaultChecked={initialValues?.method === "TRANSFER"}
              />{" "}
              โอน
            </label>
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">หมายเหตุ (ไม่บังคับ)</label>
        <input
          name="reason"
          defaultValue={initialValues?.reason}
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
