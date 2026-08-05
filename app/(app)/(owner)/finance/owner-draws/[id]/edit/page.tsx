import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OwnerDrawForm } from "../../OwnerDrawForm";
import { updateOwnerDraw } from "../../actions";

export default async function EditOwnerDrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draw = await prisma.ownerDraw.findUnique({ where: { id } });
  if (!draw) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">แก้ไขรายการเบิกเงินส่วนตัว</h1>
        <Link href="/finance/owner-draws" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าเบิกเงินส่วนตัว
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <OwnerDrawForm
          action={updateOwnerDraw.bind(null, draw.id)}
          submitLabel="บันทึกการแก้ไข"
          initialValues={{
            amount: draw.amount.toString(),
            method: draw.method,
            reason: draw.reason ?? "",
          }}
        />
      </div>
    </div>
  );
}
