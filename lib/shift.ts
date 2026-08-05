import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";

const { Decimal } = Prisma;

export function getOpenShift() {
  return prisma.cashShift.findFirst({
    where: { status: "OPEN" },
    include: { openedBy: { select: { name: true } } },
  });
}

/**
 * expectedCash = openingCash + cash sales − cash expenses − cash owner draws (all scoped to this shift).
 * PromptPay sales never touch the till, so they're excluded entirely.
 */
export async function computeExpectedCash(shiftId: string, openingCash: Prisma.Decimal) {
  const [salesAgg, expensesAgg, drawsAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { shiftId, paymentMethod: "CASH", status: "COMPLETED" },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { shiftId, paymentMethod: "CASH" },
      _sum: { amount: true },
    }),
    prisma.ownerDraw.aggregate({
      where: { shiftId, method: "CASH" },
      _sum: { amount: true },
    }),
  ]);

  const cashSales = salesAgg._sum.total ?? new Decimal(0);
  const cashExpenses = expensesAgg._sum.amount ?? new Decimal(0);
  const cashDraws = drawsAgg._sum.amount ?? new Decimal(0);

  return openingCash.add(cashSales).sub(cashExpenses).sub(cashDraws);
}
