import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function ShiftHistoryPage() {
  const session = await auth();
  const shifts = await prisma.cashShift.findMany({
    where: {
      status: "CLOSED",
      ...(session?.user.role === "OWNER" ? {} : { openedById: session?.user.id }),
    },
    orderBy: { closedAt: "desc" },
    take: 50,
    include: { openedBy: { select: { name: true } }, closedBy: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-stone-900">ประวัติกะการทำงาน</h1>

      {shifts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          ยังไม่มีประวัติกะ
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-4 py-2 font-medium">เปิดโดย</th>
                <th className="px-4 py-2 font-medium">เปิด - ปิด</th>
                <th className="px-4 py-2 font-medium text-right">เงินตั้งต้น</th>
                <th className="px-4 py-2 font-medium text-right">ควรมี</th>
                <th className="px-4 py-2 font-medium text-right">นับได้จริง</th>
                <th className="px-4 py-2 font-medium text-right">ผลต่าง</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shifts.map((s) => {
                const variance = s.variance?.toNumber() ?? 0;
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-stone-800">{s.openedBy.name}</td>
                    <td className="px-4 py-2 text-stone-500">
                      {s.openedAt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })} –{" "}
                      {s.closedAt?.toLocaleString("th-TH", { timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2 text-right text-stone-600">฿{s.openingCash.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-stone-600">฿{s.expectedCash?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-stone-600">฿{s.countedCash?.toFixed(2)}</td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        variance === 0 ? "text-emerald-600" : variance > 0 ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      {variance === 0 ? "ยอดตรง" : `${variance > 0 ? "+" : ""}฿${variance.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/shift/history/${s.id}/edit`} prefetch={false} className="text-xs text-stone-500 hover:underline">
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
