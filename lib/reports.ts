import { prisma } from "./prisma";

export type Period = "day" | "week" | "month";

export function getPeriodRange(period: Period, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(startOfToday);
  end.setDate(end.getDate() + 1);

  let start: Date;
  if (period === "day") {
    start = startOfToday;
  } else if (period === "week") {
    start = new Date(startOfToday);
    start.setDate(start.getDate() - 6);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start, end };
}

export async function computePnl(start: Date, end: Date) {
  const [salesAgg, cogsAgg, expensesAgg, ownerDrawsAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: start, lt: end } },
      _sum: { total: true },
    }),
    prisma.saleItem.aggregate({
      where: { sale: { status: "COMPLETED", createdAt: { gte: start, lt: end } } },
      _sum: { lineCogs: true },
    }),
    prisma.expense.aggregate({
      where: { incurredAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.ownerDraw.aggregate({
      where: { takenAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const sales = salesAgg._sum.total?.toNumber() ?? 0;
  const cogs = cogsAgg._sum.lineCogs?.toNumber() ?? 0;
  const expenses = expensesAgg._sum.amount?.toNumber() ?? 0;
  const ownerDraws = ownerDrawsAgg._sum.amount?.toNumber() ?? 0;
  const grossProfit = sales - cogs;
  const netProfit = grossProfit - expenses;

  return { sales, cogs, grossProfit, expenses, netProfit, ownerDraws };
}

export async function getTopProducts(start: Date, end: Date, take = 5) {
  const grouped = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { status: "COMPLETED", createdAt: { gte: start, lt: end } } },
    _sum: { lineTotal: true, quantity: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((g) => g.productId) } },
    select: { id: true, name: true, unit: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  return grouped.map((g) => ({
    product: productById.get(g.productId),
    revenue: g._sum.lineTotal?.toNumber() ?? 0,
    quantity: g._sum.quantity?.toNumber() ?? 0,
  }));
}

export async function getDailySalesTrend(days = 7, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(startOfToday);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date(startOfToday);
  end.setDate(end.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: { status: "COMPLETED", createdAt: { gte: start, lt: end } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(d.toDateString(), 0);
  }
  for (const sale of sales) {
    const key = sale.createdAt.toDateString();
    buckets.set(key, (buckets.get(key) ?? 0) + sale.total.toNumber());
  }

  return Array.from(buckets.entries()).map(([dateStr, total]) => ({
    date: new Date(dateStr),
    total,
  }));
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return products.filter((p) => p.currentStock.lte(p.reorderPoint));
}
