"use client";

import { useActionState } from "react";
import { updateShopSettings, type ActionState } from "./actions";

type Shop = {
  name: string;
  address: string | null;
  promptPayId: string | null;
  promptPayType: "PHONE" | "NATIONAL_ID" | null;
};

export function ShopSettingsForm({ shop }: { shop: Shop | null }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateShopSettings,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">ชื่อร้าน</label>
        <input
          name="name"
          required
          defaultValue={shop?.name ?? ""}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">ที่อยู่ (ไม่บังคับ)</label>
        <input
          name="address"
          defaultValue={shop?.address ?? ""}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div className="rounded-lg bg-stone-50 p-4">
        <p className="mb-3 text-sm font-medium text-stone-700">รับเงินผ่านพร้อมเพย์</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">ประเภท</label>
            <select
              name="promptPayType"
              defaultValue={shop?.promptPayType ?? "PHONE"}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            >
              <option value="PHONE">เบอร์โทรศัพท์</option>
              <option value="NATIONAL_ID">เลขบัตรประชาชน</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">หมายเลขพร้อมเพย์</label>
            <input
              name="promptPayId"
              placeholder="0812345678"
              defaultValue={shop?.promptPayId ?? ""}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-400">
          ใช้สำหรับสร้าง QR รับเงินหน้าร้านเท่านั้น ไม่ต้องเชื่อมต่อธนาคารหรือ API ใดๆ
        </p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">บันทึกการตั้งค่าเรียบร้อยแล้ว</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}
