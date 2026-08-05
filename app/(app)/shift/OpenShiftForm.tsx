"use client";

import { useActionState } from "react";
import { openShift, type ActionState } from "./actions";

export function OpenShiftForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(openShift, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">เงินสดตั้งต้นในลิ้นชัก (บาท)</label>
        <input
          name="openingCash"
          type="number"
          step="1"
          min="0"
          required
          defaultValue="0"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base focus:border-stone-500 focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังเปิดกะ..." : "เปิดกะ"}
      </button>
    </form>
  );
}
