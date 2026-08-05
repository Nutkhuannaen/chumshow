"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";

type Category = { id: string; name: string };

type ProductFormValues = {
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  unit: string;
  sellPrice: string;
  reorderPoint: string;
  isActive: boolean;
};

export function ProductForm({
  categories,
  action,
  initialValues,
  submitLabel,
}: {
  categories: Category[];
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">ชื่อสินค้า</label>
        <input
          name="name"
          required
          defaultValue={initialValues?.name}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">SKU (ไม่บังคับ)</label>
          <input
            name="sku"
            defaultValue={initialValues?.sku ?? ""}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">บาร์โค้ด (ไม่บังคับ)</label>
          <input
            name="barcode"
            defaultValue={initialValues?.barcode ?? ""}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">หมวดหมู่</label>
          <select
            name="categoryId"
            defaultValue={initialValues?.categoryId ?? ""}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          >
            <option value="">— ไม่ระบุ —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">หน่วยนับ</label>
          <input
            name="unit"
            defaultValue={initialValues?.unit ?? "ชิ้น"}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">ราคาขาย (บาท)</label>
          <input
            name="sellPrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initialValues?.sellPrice}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">จุดสั่งซื้อ (แจ้งเตือนของใกล้หมด)</label>
          <input
            name="reorderPoint"
            type="number"
            step="1"
            min="0"
            defaultValue={initialValues?.reorderPoint ?? "0"}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="isActive" defaultChecked={initialValues?.isActive ?? true} />
        เปิดขายสินค้านี้
      </label>

      {!initialValues && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ต้นทุนสินค้าจะคำนวณอัตโนมัติเมื่อคุณ &quot;รับสินค้าเข้า&quot; ครั้งแรก — สร้างสินค้าก่อน แล้วไปที่หน้ารับสินค้าเข้า
        </p>
      )}

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
