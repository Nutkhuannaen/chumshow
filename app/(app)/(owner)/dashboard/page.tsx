import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  computePnl,
  getDailySalesTrend,
  getLowStockProducts,
  getPeriodRange,
  getTopProducts,
  type Period,
} from "@/lib/reports";

const PERIOD_LABELS: Record<Period, string> = {
  day: "รายวัน",
  week: "รายสัปดาห์",
  month: "เดือนนี้",
  "3months": "3 เดือน",
  "6months": "6 เดือน",
  year: "1 ปี",
  custom: "กำหนดเอง",
};

const PRESET_PERIODS: Period[] = ["day", "week", "month", "3months", "6months", "year"];

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; depreciation?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const depreciationOn = sp.depreciation === "1";
  const depreciationQuery = depreciationOn ? "&depreciation=1" : "";

  let period: Period = (PRESET_PERIODS as string[]).includes(sp.period ?? "")
    ? (sp.period as Period)
    : sp.period === "custom"
      ? "custom"
      : "day";

  let customStart: Date | undefined;
  let customEnd: Date | undefined;
  if (period === "custom") {
    const parsedStart = sp.start ? new Date(sp.start) : undefined;
    const parsedEnd = sp.end ? new Date(sp.end) : undefined;
    if (parsedStart && parsedEnd && !isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
      customStart = parsedStart;
      customEnd = parsedEnd;
    } else {
      period = "day";
    }
  }

  const { start, end } = getPeriodRange(period, new Date(), customStart, customEnd);
  const periodLabel =
    period === "custom" && customStart && customEnd
      ? `${customStart.toLocaleDateString("th-TH", { dateStyle: "medium" })} – ${customEnd.toLocaleDateString("th-TH", { dateStyle: "medium" })}`
      : PERIOD_LABELS[period];

  const [pnl, topProducts, trend, lowStock, capexItems] = await Promise.all([
    computePnl(start, end),
    getTopProducts(start, end),
    getDailySalesTrend(7),
    getLowStockProducts(),
    prisma.capexItem.findMany(),
  ]);

  const capexTotal = capexItems.reduce((sum, i) => sum + i.amount.toNumber(), 0);
  const monthlyDepreciation = capexItems.reduce(
    (sum, i) => sum + (i.usefulLifeMonths ? i.amount.toNumber() / i.usefulLifeMonths : 0),
    0,
  );
  const netProfitDisplayed = depreciationOn ? pnl.netProfit - monthlyDepreciation : pnl.netProfit;

  const maxTrend = Math.max(1, ...trend.map((t) => t.total));

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-lg font-semibold text-stone-900">ภาพรวมร้าน</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl bg-stone-200 p-1">
          {PRESET_PERIODS.map((p) => (
            <Link
              key={p}
              href={`/dashboard?period=${p}${depreciationQuery}`}
              prefetch={false}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                period === p ? "bg-white text-stone-900 shadow" : "text-stone-600"
              }`}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>

        <form
          action="/dashboard"
          className={`flex flex-wrap items-center gap-2 rounded-xl border px-2 py-1 text-sm ${
            period === "custom" ? "border-stone-900" : "border-stone-200"
          }`}
        >
          <input type="hidden" name="period" value="custom" />
          {depreciationOn && <input type="hidden" name="depreciation" value="1" />}
          <input
            type="date"
            name="start"
            defaultValue={customStart ? toDateInputValue(customStart) : undefined}
            required
            className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-700 focus:border-stone-500 focus:outline-none"
          />
          <span className="text-xs text-stone-400">ถึง</span>
          <input
            type="date"
            name="end"
            defaultValue={customEnd ? toDateInputValue(customEnd) : undefined}
            required
            className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-700 focus:border-stone-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-3 py-1 text-xs font-medium text-white hover:bg-stone-800"
          >
            ดูช่วงนี้
          </button>
        </form>
      </div>

      {/* P&L */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-stone-700">กำไร-ขาดทุน ({periodLabel})</h2>
        <div className="space-y-2 text-sm">
          <Row label="ขายได้" value={pnl.sales} />
          <Row label="− ต้นทุนของที่ขายไป" value={-pnl.cogs} muted />
          <Row label="= กำไรขั้นต้น" value={pnl.grossProfit} bold border />
          <Row label="− ค่าใช้จ่ายร้าน" value={-pnl.expenses} muted />
          {depreciationOn && (
            <Row label="− ค่าเสื่ออุปกรณ์ (โดยประมาณ, ต่อเดือน)" value={-monthlyDepreciation} muted />
          )}
          <Row label="= กำไรสุทธิ" value={netProfitDisplayed} bold border big />
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-stone-500">
          <Link
            href={`/dashboard?period=${period}${
              period === "custom" ? `&start=${sp.start}&end=${sp.end}` : ""
            }${depreciationOn ? "" : "&depreciation=1"}`}
            className="flex items-center gap-2"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                depreciationOn ? "border-stone-900 bg-stone-900" : "border-stone-300"
              }`}
            >
              {depreciationOn && <span className="h-2 w-2 rounded-sm bg-white" />}
            </span>
            รวมค่าเสื่อมอุปกรณ์ในรายจ่าย
          </Link>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-800">เงินที่เจ้าของเบิกไป ({periodLabel})</p>
          <p className="text-2xl font-bold text-amber-900">฿{pnl.ownerDraws.toFixed(2)}</p>
          <p className="mt-1 text-xs text-amber-700">
            นี่ไม่ใช่ค่าใช้จ่ายร้าน แต่เป็นเงินส่วนตัวที่เจ้าของถอนออกจากร้าน — ไม่ถูกหักในกำไร-ขาดทุนด้านบน
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">เงินลงทุนเริ่มต้นทั้งหมด (CAPEX)</p>
          <p className="text-2xl font-bold text-stone-900">฿{capexTotal.toFixed(2)}</p>
          <Link href="/finance/capex" className="mt-1 inline-block text-xs text-stone-500 hover:underline">
            ดูรายการลงทุน →
          </Link>
        </div>
      </div>

      {/* Sales trend */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-stone-700">ยอดขาย 7 วันล่าสุด</h2>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {trend.map((t) => (
            <div key={t.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-stone-800"
                style={{ height: `${Math.max(4, (t.total / maxTrend) * 100)}px` }}
                title={`฿${t.total.toFixed(2)}`}
              />
              <span className="text-[10px] text-stone-400">
                {t.date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Top products */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">สินค้าขายดี ({periodLabel})</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-stone-400">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topProducts.map((tp) => (
                <li key={tp.product?.id} className="flex justify-between">
                  <span className="text-stone-700">{tp.product?.name ?? "—"}</span>
                  <span className="text-stone-500">
                    {tp.quantity} {tp.product?.unit} · ฿{tp.revenue.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low stock */}
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">สินค้าใกล้หมด</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-400">ไม่มีสินค้าใกล้หมด</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="text-stone-700">{p.name}</span>
                  <span className="font-medium text-red-600">
                    เหลือ {p.currentStock.toString()} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  border,
  big,
}: {
  label: string;
  value: number;
  muted?: boolean;
  bold?: boolean;
  border?: boolean;
  big?: boolean;
}) {
  return (
    <div className={`flex justify-between ${border ? "border-t border-stone-200 pt-2" : ""}`}>
      <span className={muted ? "text-stone-500" : bold ? "text-stone-900" : "text-stone-700"}>{label}</span>
      <span
        className={`${bold ? "font-semibold" : ""} ${big ? "text-lg" : ""} ${
          value < 0 && bold ? "text-red-600" : bold ? "text-stone-900" : "text-stone-700"
        }`}
      >
        ฿{value.toFixed(2)}
      </span>
    </div>
  );
}
