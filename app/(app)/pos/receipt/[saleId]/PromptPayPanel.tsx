"use client";

import { useActionState } from "react";
import { confirmPromptPayPayment, cancelPendingPromptPay, type ActionState } from "../../actions";

export function PromptPayPanel({ saleId, qrDataUrl }: { saleId: string; qrDataUrl: string }) {
  const [confirmState, confirmAction, confirmPending] = useActionState<ActionState, FormData>(
    confirmPromptPayPayment,
    undefined,
  );
  const [cancelState, cancelActionFn, cancelPending] = useActionState<ActionState, FormData>(
    cancelPendingPromptPay,
    undefined,
  );

  return (
    <div className="space-y-3 border-t border-dashed border-stone-300 pt-4">
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="PromptPay QR" className="h-56 w-56 rounded-lg border border-stone-200" />
      </div>
      <p className="text-center text-xs text-stone-500">
        ให้ลูกค้าสแกนด้วยแอปธนาคาร แล้วกดยืนยันเมื่อเงินเข้าบัญชีร้านแล้ว
      </p>

      <form action={confirmAction}>
        <input type="hidden" name="saleId" value={saleId} />
        {confirmState?.error && <p className="mb-2 text-sm text-red-600">{confirmState.error}</p>}
        <button
          type="submit"
          disabled={confirmPending}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {confirmPending ? "กำลังยืนยัน..." : "ยืนยันว่าได้รับเงินแล้ว"}
        </button>
      </form>

      <form action={cancelActionFn}>
        <input type="hidden" name="saleId" value={saleId} />
        {cancelState?.error && <p className="mb-2 text-sm text-red-600">{cancelState.error}</p>}
        <button
          type="submit"
          disabled={cancelPending}
          className="w-full rounded-xl border border-red-300 py-2.5 text-sm text-red-600 disabled:opacity-40"
        >
          {cancelPending ? "กำลังยกเลิก..." : "ยกเลิกรายการนี้"}
        </button>
      </form>
    </div>
  );
}
