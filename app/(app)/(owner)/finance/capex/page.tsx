import { prisma } from "@/lib/prisma";
import { CapexForm } from "./CapexForm";

export default async function CapexPage() {
  const items = await prisma.capexItem.findMany({ orderBy: { purchaseDate: "desc" } });
  const total = items.reduce((sum, i) => sum + i.amount.toNumber(), 0);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-stone-900">เงินลงทุน (CAPEX)</h1>
      <p className="text-sm text-stone-500">
        บันทึกเงินที่ลงทุนซื้ออุปกรณ์หรือตกแต่งร้านตอนเริ่มต้น — เพื่อให้เห็นภาพรวมว่าลงทุนไปเท่าไหร่แล้ว
      </p>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <CapexForm />
      </div>

      <div className="rounded-xl bg-stone-900 p-5 text-white">
        <p className="text-sm text-stone-300">เงินลงทุนเริ่มต้นทั้งหมด</p>
        <p className="text-2xl font-bold">฿{total.toFixed(2)}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-stone-700">รายการลงทุน</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
            ยังไม่มีรายการลงทุน
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-2 font-medium">รายการ</th>
                  <th className="px-4 py-2 font-medium">หมวด</th>
                  <th className="px-4 py-2 font-medium">วันที่ซื้อ</th>
                  <th className="px-4 py-2 font-medium text-right">จำนวนเงิน</th>
                  <th className="px-4 py-2 font-medium text-right">ค่าเสื่อม/เดือน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-stone-800">{item.name}</td>
                    <td className="px-4 py-2 text-stone-500">{item.categoryLabel ?? "—"}</td>
                    <td className="px-4 py-2 text-stone-500">
                      {item.purchaseDate.toLocaleDateString("th-TH", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-2 text-right text-stone-800">฿{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-stone-500">
                      {item.usefulLifeMonths
                        ? `฿${(item.amount.toNumber() / item.usefulLifeMonths).toFixed(2)}`
                        : "ยังไม่ได้ระบุอายุการใช้งาน"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
