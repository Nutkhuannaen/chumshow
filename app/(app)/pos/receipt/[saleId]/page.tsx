import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ReceiptPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, cashier: { select: { name: true } } },
  });

  if (!sale) notFound();

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 text-center">
          <p className="text-sm text-stone-500">ใบเสร็จ</p>
          <p className="text-lg font-semibold text-stone-900">#{sale.saleNumber}</p>
          <p className="text-xs text-stone-400">
            {sale.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          <p className="text-xs text-stone-400">แคชเชียร์: {sale.cashier.name}</p>
        </div>

        <div className="space-y-1 border-t border-dashed border-stone-300 py-3 text-sm">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-stone-700">
                {item.productNameSnapshot} × {item.quantity.toString()}
              </span>
              <span className="text-stone-900">฿{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-dashed border-stone-300 pt-3 text-sm">
          <div className="flex justify-between font-semibold text-stone-900">
            <span>ยอดรวม</span>
            <span>฿{sale.total.toFixed(2)}</span>
          </div>
          {sale.paymentMethod === "CASH" && (
            <>
              <div className="flex justify-between text-stone-500">
                <span>รับเงิน</span>
                <span>฿{sale.cashReceived?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>เงินทอน</span>
                <span>฿{sale.changeGiven?.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href="/pos"
          className="flex-1 rounded-xl bg-stone-900 py-3 text-center text-sm font-semibold text-white"
        >
          ขายรายการถัดไป
        </Link>
        <Link
          href={`/sales/${sale.id}`}
          className="rounded-xl border border-stone-300 px-4 py-3 text-center text-sm text-stone-600"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </div>
  );
}
