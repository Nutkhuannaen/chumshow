import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "../../ExpenseForm";
import { updateExpense } from "../../actions";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, categories] = await Promise.all([
    prisma.expense.findUnique({ where: { id } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!expense) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">แก้ไขค่าใช้จ่าย</h1>
        <Link href="/finance/expenses" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าค่าใช้จ่าย
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <ExpenseForm
          categories={categories}
          action={updateExpense.bind(null, expense.id)}
          submitLabel="บันทึกการแก้ไข"
          initialValues={{
            categoryId: expense.categoryId,
            amount: expense.amount.toString(),
            description: expense.description ?? "",
            paymentMethod: expense.paymentMethod,
          }}
        />
      </div>
    </div>
  );
}
