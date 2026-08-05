"use client";

import { useActionState, useState } from "react";
import { voidSale, type ActionState } from "../actions";

export function VoidSaleForm({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(voidSale, undefined);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        ยกเลิกการขายนี้
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="saleId" value={saleId} />
      <p className="mb-2 text-sm text-red-800">
        ยกเลิกรายการนี้จะคืนสินค้าทั้งหมดกลับเข้าสต็อก การกระทำนี้ย้อนกลับไม่ได้
      </p>
      <input
        name="voidReason"
        placeholder="เหตุผล (ไม่บังคับ)"
        className="mb-2 w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:outline-none"
      />
      {state?.error && <p className="mb-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600"
        >
          ไม่ยกเลิก
        </button>
      </div>
    </form>
  );
}
