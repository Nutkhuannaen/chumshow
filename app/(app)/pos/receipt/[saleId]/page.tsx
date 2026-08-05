import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generatePromptPayQrDataUrl } from "@/lib/promptpay";
import { PromptPayPanel } from "./PromptPayPanel";

export default async function ReceiptPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true, cashier: { select: { name: true } } },
  });

  if (!sale) notFound();

  const isPendingPromptPay = sale.paymentMethod === "PROMPTPAY" && sale.status === "PENDING_PAYMENT";
  let qrDataUrl: string | null = null;
  if (isPendingPromptPay) {
    const shop = await prisma.shop.findFirst();
    if (shop?.promptPayId) {
      qrDataUrl = await generatePromptPayQrDataUrl(shop.promptPayId, sale.total.toNumber());
    }
  }

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
          {sale.status === "VOIDED" && (
            <p className="mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              ยกเลิกแล้ว
            </p>
          )}
          {isPendingPromptPay && (
            <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              รอชำระเงิน
            </p>
          )}
          {sale.status === "COMPLETED" && sale.paymentMethod === "PROMPTPAY" && (
            <p className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              ชำระผ่านพร้อมเพย์แล้ว
            </p>
          )}
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

        {isPendingPromptPay &&
          (qrDataUrl ? (
            <PromptPayPanel saleId={sale.id} qrDataUrl={qrDataUrl} />
          ) : (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
              ร้านยังไม่ได้ตั้งค่าพร้อมเพย์ — ไปที่หน้าตั้งค่าเพื่อเพิ่มหมายเลขพร้อมเพย์
            </p>
          ))}
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
