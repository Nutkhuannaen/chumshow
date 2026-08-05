"use client";

import { useActionState, useState } from "react";
import { createStockIn, type ActionState } from "./actions";

type Product = { id: string; name: string; unit: string; costPrice: string };

let nextRowId = 1;

export function StockInForm({ products }: { products: Product[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createStockIn, undefined);
  const [rows, setRows] = useState<{ id: number; productId: string; quantity: string; unitCost: string }[]>([
    { id: nextRowId++, productId: "", quantity: "", unitCost: "" },
  ]);

  function updateRow(id: number, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: nextRowId++, productId: "", quantity: "", unitCost: "" }]);
  }

  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  const total = rows.reduce((sum, r) => {
    const q = parseFloat(r.quantity) || 0;
    const c = parseFloat(r.unitCost) || 0;
    return sum + q * c;
  }, 0);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">ผู้ขาย/ร้านค้า (ไม่บังคับ)</label>
          <input
            name="supplierName"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">หมายเหตุ (ไม่บังคับ)</label>
          <input
            name="note"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const selectedProduct = products.find((p) => p.id === row.productId);
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
                {selectedProduct && (
                  <p className="mt-1 text-xs text-stone-400">
                    ต้นทุนเฉลี่ยปัจจุบัน ฿{selectedProduct.costPrice} / {selectedProduct.unit}
                  </p>
                )}
              </div>
              <div className="w-28">
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  placeholder="จำนวน"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                />
              </div>
              <div className="w-32">
                <input
                  name="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="ต้นทุน/หน่วย"
                  value={row.unitCost}
                  onChange={(e) => updateRow(row.id, { unitCost: e.target.value })}
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
        <p className="text-sm text-stone-500">
          รวมทั้งหมด: <span className="text-base font-semibold text-stone-900">฿{total.toFixed(2)}</span>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกรับสินค้าเข้า"}
        </button>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
