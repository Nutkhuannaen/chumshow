import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "สำเร็จ",
  PENDING_PAYMENT: "รอชำระเงิน",
  VOIDED: "ยกเลิกแล้ว",
};

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      cashier: { select: { name: true } },
      items: { select: { lineCogs: true } },
    },
  });

  const header = [
    "เลขที่ใบเสร็จ",
    "วันที่",
    "เวลา",
    "แคชเชียร์",
    "ช่องทางชำระ",
    "สถานะ",
    "ยอดขายก่อนหักส่วนลด",
    "ส่วนลด",
    "ยอดสุทธิ",
    "ต้นทุนขาย",
    "กำไรขั้นต้น",
  ];

  const rows = sales.map((s) => {
    const cogs = s.items.reduce((sum, i) => sum + i.lineCogs.toNumber(), 0);
    const total = s.total.toNumber();
    return [
      s.saleNumber,
      s.createdAt.toLocaleDateString("th-TH"),
      s.createdAt.toLocaleTimeString("th-TH"),
      s.cashier.name,
      s.paymentMethod === "CASH" ? "เงินสด" : "พร้อมเพย์",
      STATUS_LABELS[s.status] ?? s.status,
      s.subtotal.toFixed(2),
      s.discount.toFixed(2),
      total.toFixed(2),
      cogs.toFixed(2),
      (total - cogs).toFixed(2),
    ];
  });

  const csvBody = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  // Leading BOM so Excel opens the Thai text as UTF-8 instead of mangling it.
  const csv = "\uFEFF" + csvBody;

  const filenameDate = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-${filenameDate}.csv"`,
    },
  });
}
