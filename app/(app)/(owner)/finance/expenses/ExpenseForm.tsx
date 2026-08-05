"use client";

import { useActionState } from "react";
import { createExpense, createExpenseCategory, type ActionState } from "./actions";

type Category = { id: string; name: string };

export function ExpenseForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createExpense, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">หมวดหมู่</label>
          <select
            name="categoryId"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          >
            <option value="">— เลือก —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">จำนวนเงิน (บาท)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">รายละเอียด (ไม่บังคับ)</label>
        <input
          name="description"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">จ่ายด้วย</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentMethod" value="CASH" defaultChecked /> เงินสดจากลิ้นชัก
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentMethod" value="TRANSFER" /> โอน/อื่นๆ
          </label>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || categories.length === 0}
        className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกค่าใช้จ่าย"}
      </button>
      {categories.length === 0 && (
        <p className="text-xs text-amber-600">เพิ่มหมวดหมู่ค่าใช้จ่ายก่อนด้านล่าง</p>
      )}
    </form>
  );
}

export function CategoryQuickAdd() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createExpenseCategory,
    undefined,
  );

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="name"
          placeholder="เพิ่มหมวดหมู่ เช่น ค่าไฟ, ค่าเช่า"
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
        {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-100 px-4 py-2 text-sm text-stone-700 disabled:opacity-40"
      >
        เพิ่ม
      </button>
    </form>
  );
}
