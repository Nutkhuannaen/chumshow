"use client";

import { useActionState, useState } from "react";
import { resetShopData, type ActionState } from "./actions";
import { RESET_CONFIRM_PHRASE } from "./constants";

export function ResetShopSection() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(resetShopData, undefined);
  const [confirmText, setConfirmText] = useState("");
  const canSubmit = confirmText === RESET_CONFIRM_PHRASE;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <h2 className="text-sm font-semibold text-red-800">รีเซ็ตร้านใหม่ทั้งหมด</h2>
      <p className="mt-1 text-sm text-red-700">
        ลบสินค้า หมวดหมู่สินค้า สต็อก ยอดขาย กะการทำงาน ค่าใช้จ่าย เบิกเงินส่วนตัว และเงินลงทุนทั้งหมดอย่างถาวร
        — เหมือนเปิดร้านใหม่ที่ยังไม่มีข้อมูลอะไรเลย บัญชีผู้ใช้และการตั้งค่าร้าน (ชื่อร้าน/พร้อมเพย์) จะไม่ถูกลบ
        <strong> การกระทำนี้ย้อนกลับไม่ได้</strong>
      </p>
      <form action={formAction} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-red-700">
            พิมพ์ &quot;{RESET_CONFIRM_PHRASE}&quot; เพื่อยืนยัน
          </label>
          <input
            name="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={RESET_CONFIRM_PHRASE}
            autoComplete="off"
            className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={!canSubmit || pending}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "กำลังรีเซ็ต..." : "ลบข้อมูลทั้งหมดและเริ่มใหม่"}
        </button>
      </form>
    </div>
  );
}
