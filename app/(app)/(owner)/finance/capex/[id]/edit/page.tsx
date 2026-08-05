import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CapexForm } from "../../CapexForm";
import { updateCapexItem } from "../../actions";

export default async function EditCapexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.capexItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">แก้ไขรายการลงทุน</h1>
        <Link href="/finance/capex" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าเงินลงทุน
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <CapexForm
          action={updateCapexItem.bind(null, item.id)}
          submitLabel="บันทึกการแก้ไข"
          initialValues={{
            name: item.name,
            categoryLabel: item.categoryLabel ?? "",
            amount: item.amount.toString(),
            purchaseDate: item.purchaseDate.toISOString().slice(0, 10),
            usefulLifeMonths: item.usefulLifeMonths?.toString() ?? "",
            note: item.note ?? "",
          }}
        />
      </div>
    </div>
  );
}
