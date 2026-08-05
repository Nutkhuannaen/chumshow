import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OwnerDrawForm } from "./OwnerDrawForm";

export default async function OwnerDrawsPage() {
  const draws = await prisma.ownerDraw.findMany({
    orderBy: { takenAt: "desc" },
    take: 50,
    include: { takenBy: { select: { name: true } } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-stone-900">เบิกเงินส่วนตัว</h1>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <OwnerDrawForm />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-stone-700">รายการล่าสุด</h2>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">วันที่</th>
                <th className="px-4 py-2 font-medium">โดย</th>
                <th className="px-4 py-2 font-medium">วิธี</th>
                <th className="px-4 py-2 font-medium">หมายเหตุ</th>
                <th className="px-4 py-2 font-medium text-right">จำนวนเงิน</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {draws.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                    ยังไม่มีรายการเบิกเงิน
                  </td>
                </tr>
              ) : (
                draws.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-stone-500">
                      {d.takenAt.toLocaleDateString("th-TH", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-2 text-stone-800">{d.takenBy.name}</td>
                    <td className="px-4 py-2 text-stone-500">{d.method === "CASH" ? "เงินสด" : "โอน"}</td>
                    <td className="px-4 py-2 text-stone-500">{d.reason ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-stone-800">฿{d.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/finance/owner-draws/${d.id}/edit`} prefetch={false} className="text-xs text-stone-500 hover:underline">
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
