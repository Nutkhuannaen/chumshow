import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { VoidSaleForm } from "./VoidSaleForm";

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "สำเร็จ",
  PENDING_PAYMENT: "รอชำระเงิน",
  VOIDED: "ยกเลิกแล้ว",
};

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sale, session] = await Promise.all([
    prisma.sale.findUnique({
      where: { id },
      include: { items: true, cashier: { select: { name: true, id: true } } },
    }),
    auth(),
  ]);

  if (!sale) notFound();

  const canVoid =
    sale.status === "COMPLETED" &&
    (session?.user.role === "OWNER" || sale.cashierId === session?.user.id);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">รายการขาย #{sale.saleNumber}</h1>
        <Link href="/sales" className="text-sm text-stone-500 hover:underline">
          ← กลับไปประวัติการขาย
        </Link>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-stone-400">วันที่</p>
            <p className="text-stone-800">
              {sale.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <div>
            <p className="text-stone-400">แคชเชียร์</p>
            <p className="text-stone-800">{sale.cashier.name}</p>
          </div>
          <div>
            <p className="text-stone-400">ช่องทาง</p>
            <p className="text-stone-800">{sale.paymentMethod === "CASH" ? "เงินสด" : "พร้อมเพย์"}</p>
          </div>
          <div>
            <p className="text-stone-400">สถานะ</p>
            <p
              className={
                sale.status === "VOIDED"
                  ? "text-red-500"
                  : sale.status === "PENDING_PAYMENT"
                    ? "text-amber-600"
                    : "text-emerald-600"
              }
            >
              {STATUS_LABELS[sale.status] ?? sale.status}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="text-left text-xs text-stone-400">
            <tr>
              <th className="py-1 font-medium">สินค้า</th>
              <th className="py-1 font-medium text-right">จำนวน</th>
              <th className="py-1 font-medium text-right">ราคา/หน่วย</th>
              <th className="py-1 font-medium text-right">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-1.5 text-stone-800">{item.productNameSnapshot}</td>
                <td className="py-1.5 text-right text-stone-600">
                  {item.quantity.toString()}
                </td>
                <td className="py-1.5 text-right text-stone-600">฿{item.unitPriceSnapshot.toFixed(2)}</td>
                <td className="py-1.5 text-right text-stone-800">฿{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-sm">
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

        {sale.status === "VOIDED" && sale.voidReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            เหตุผลที่ยกเลิก: {sale.voidReason}
          </p>
        )}
      </div>

      {canVoid && <VoidSaleForm saleId={sale.id} />}
    </div>
  );
}
