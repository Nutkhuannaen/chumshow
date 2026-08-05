import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExpenseForm, CategoryQuickAdd } from "./ExpenseForm";

export default async function ExpensesPage() {
  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      orderBy: { incurredAt: "desc" },
      take: 50,
      include: { category: true, createdBy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-stone-900">ค่าใช้จ่ายร้าน</h1>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <ExpenseForm categories={categories} />
      </div>

      <details className="rounded-xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-600">
          จัดการหมวดหมู่ค่าใช้จ่าย
        </summary>
        <div className="mt-3">
          <CategoryQuickAdd />
        </div>
      </details>

      <div>
        <h2 className="mb-2 text-sm font-medium text-stone-700">รายการล่าสุด</h2>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">วันที่</th>
                <th className="px-4 py-2 font-medium">หมวดหมู่</th>
                <th className="px-4 py-2 font-medium">รายละเอียด</th>
                <th className="px-4 py-2 font-medium">จ่ายด้วย</th>
                <th className="px-4 py-2 font-medium text-right">จำนวนเงิน</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                    ยังไม่มีค่าใช้จ่าย
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-stone-500">
                      {e.incurredAt.toLocaleDateString("th-TH", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-2 text-stone-800">{e.category.name}</td>
                    <td className="px-4 py-2 text-stone-500">{e.description ?? "—"}</td>
                    <td className="px-4 py-2 text-stone-500">
                      {e.paymentMethod === "CASH" ? "เงินสด" : "โอน/อื่นๆ"}
                    </td>
                    <td className="px-4 py-2 text-right text-stone-800">฿{e.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/finance/expenses/${e.id}/edit`} prefetch={false} className="text-xs text-stone-500 hover:underline">
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
