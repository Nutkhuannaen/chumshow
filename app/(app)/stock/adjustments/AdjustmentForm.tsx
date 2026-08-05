"use client";

import { useActionState, useState } from "react";
import { createAdjustment, type ActionState } from "./actions";

type Product = { id: string; name: string; unit: string; currentStock: string };

const REASON_LABELS: Record<string, string> = {
  DAMAGE: "สินค้าเสียหาย",
  THEFT: "สูญหาย/ถูกขโมย",
  EXPIRED: "หมดอายุ",
  COUNT_CORRECTION: "นับสต็อกจริงไม่ตรง",
  OTHER: "อื่นๆ",
};

let nextRowId = 1;

export function AdjustmentForm({ products }: { products: Product[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createAdjustment, undefined);
  const [rows, setRows] = useState<{ id: number; productId: string; quantityDelta: string }[]>([
    { id: nextRowId++, productId: "", quantityDelta: "" },
  ]);

  function updateRow(id: number, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { id: nextRowId++, productId: "", quantityDelta: "" }]);
  }
  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">เหตุผล</label>
          <select
            name="reason"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          >
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">หมายเหตุ (ไม่บังคับ)</label>
          <input
            name="note"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <p className="text-xs text-stone-500">
        ใส่จำนวนติดลบเพื่อตัดสต็อกที่หายไป (เช่น -2) หรือใส่จำนวนบวกเพื่อเพิ่มสต็อกที่นับเจอเกิน (เช่น 3)
      </p>

      <div className="space-y-2">
        {rows.map((row) => {
          const selected = products.find((p) => p.id === row.productId);
          return (
            <div key={row.id} className="flex items-start gap-2 rounded-lg border border-stone-200 p-3">
              <div className="flex-1">
                <select
                  name="productId"
                  required
                  value={row.productId}
                  onChange={(e) => updateRow(row.id, { productId: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                >
                  <option value="">— เลือกสินค้า —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selected && (
                  <p className="mt-1 text-xs text-stone-400">
                    คงเหลือปัจจุบัน {selected.currentStock} {selected.unit}
                  </p>
                )}
              </div>
              <div className="w-32">
                <input
                  name="quantityDelta"
                  type="number"
                  step="0.001"
                  required
                  placeholder="+/- จำนวน"
                  value={row.quantityDelta}
                  onChange={(e) => updateRow(row.id, { quantityDelta: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="mt-1.5 text-xs text-red-600 hover:underline disabled:opacity-30"
              >
                ลบ
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={addRow} className="text-sm text-stone-600 hover:underline">
        + เพิ่มรายการสินค้า
      </button>

      <div className="flex items-center justify-between border-t border-stone-200 pt-4">
        {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : <span />}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการปรับปรุงสต็อก"}
        </button>
      </div>
    </form>
  );
}
