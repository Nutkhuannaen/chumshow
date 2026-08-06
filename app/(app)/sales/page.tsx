import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "สำเร็จ",
  PENDING_PAYMENT: "รอชำระเงิน",
  VOIDED: "ยกเลิกแล้ว",
};

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { cashier: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-stone-900">ประวัติการขาย</h1>
        <a
          href="/api/export/sales"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
        >
          ส่งออก CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">เลขที่</th>
              <th className="px-4 py-2 font-medium">วันที่</th>
              <th className="px-4 py-2 font-medium">แคชเชียร์</th>
              <th className="px-4 py-2 font-medium">ช่องทาง</th>
              <th className="px-4 py-2 font-medium text-right">ยอดรวม</th>
              <th className="px-4 py-2 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  ยังไม่มีรายการขาย
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    <Link href={`/sales/${s.id}`} prefetch={false} className="font-medium text-stone-800 hover:underline">
                      {s.saleNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-stone-500">
                    {s.createdAt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2 text-stone-500">{s.cashier.name}</td>
                  <td className="px-4 py-2 text-stone-500">
                    {s.paymentMethod === "CASH" ? "เงินสด" : "พร้อมเพย์"}
                  </td>
                  <td className="px-4 py-2 text-right text-stone-800">฿{s.total.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        s.status === "VOIDED"
                          ? "text-red-500"
                          : s.status === "PENDING_PAYMENT"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
