"use client";

import { useActionState, useState } from "react";
import { closeShift, type ActionState } from "../actions";

export function CloseShiftForm({ expectedCash }: { expectedCash: number }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(closeShift, undefined);
  const [counted, setCounted] = useState("");

  const countedNum = parseFloat(counted);
  const hasCounted = counted !== "" && !Number.isNaN(countedNum);
  const variance = hasCounted ? countedNum - expectedCash : 0;

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500">เงินสดที่ควรมี (ตามระบบ)</span>
          <span className="font-medium text-stone-900">฿{expectedCash.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">นับเงินสดในลิ้นชักได้จริง (บาท)</label>
        <input
          name="countedCash"
          type="number"
          step="1"
          min="0"
          required
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base focus:border-stone-500 focus:outline-none"
        />
      </div>

      {hasCounted && (
        <div
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            variance === 0
              ? "bg-emerald-50 text-emerald-700"
              : variance > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          {variance === 0
            ? "ยอดตรง"
            : variance > 0
              ? `เงินเกิน ฿${variance.toFixed(2)}`
              : `เงินขาด ฿${Math.abs(variance).toFixed(2)}`}
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !hasCounted}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังปิดกะ..." : "ยืนยันปิดกะ"}
      </button>
    </form>
  );
}
