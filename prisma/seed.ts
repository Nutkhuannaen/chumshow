import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashSecret } from "../lib/password";
import { receiveStock } from "../lib/costing";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORY_NAMES = [
  "เครื่องดื่ม",
  "ขนม/ของว่าง",
  "บะหมี่กึ่งสำเร็จรูป",
  "ผลิตภัณฑ์นม",
  "ของใช้ในบ้าน",
  "เบเกอรี่",
  "ของชำทั่วไป",
] as const;

type ProductSeed = {
  sku: string;
  name: string;
  category: (typeof CATEGORY_NAMES)[number];
  unit: string;
  costPrice: number;
  sellPrice: number;
  reorderPoint: number;
  initialStock: number;
};

const PRODUCTS: ProductSeed[] = [
  { sku: "BEV-001", name: "น้ำอัดลมโค้ก 325ml", category: "เครื่องดื่ม", unit: "ขวด", costPrice: 8, sellPrice: 12, reorderPoint: 12, initialStock: 48 },
  { sku: "BEV-002", name: "เป๊ปซี่ 325ml", category: "เครื่องดื่ม", unit: "ขวด", costPrice: 8, sellPrice: 12, reorderPoint: 12, initialStock: 36 },
  { sku: "BEV-003", name: "น้ำดื่มสิงห์ 600ml", category: "เครื่องดื่ม", unit: "ขวด", costPrice: 5, sellPrice: 8, reorderPoint: 24, initialStock: 60 },
  { sku: "NDL-001", name: "มาม่าต้มยำกุ้ง", category: "บะหมี่กึ่งสำเร็จรูป", unit: "ซอง", costPrice: 5.5, sellPrice: 7, reorderPoint: 20, initialStock: 100 },
  { sku: "NDL-002", name: "ไวไวหมูสับ", category: "บะหมี่กึ่งสำเร็จรูป", unit: "ซอง", costPrice: 5, sellPrice: 6, reorderPoint: 20, initialStock: 80 },
  { sku: "BAK-001", name: "ขนมปังฟาร์มเฮ้าส์", category: "เบเกอรี่", unit: "ถุง", costPrice: 20, sellPrice: 28, reorderPoint: 5, initialStock: 15 },
  { sku: "DAI-001", name: "นมโฟร์โมสต์ยูเอชที", category: "ผลิตภัณฑ์นม", unit: "กล่อง", costPrice: 12, sellPrice: 16, reorderPoint: 10, initialStock: 30 },
  { sku: "HOM-001", name: "ผงซักฟอกบรีส", category: "ของใช้ในบ้าน", unit: "ถุง", costPrice: 45, sellPrice: 59, reorderPoint: 5, initialStock: 10 },
  { sku: "HOM-002", name: "สบู่เหลวลักส์", category: "ของใช้ในบ้าน", unit: "ขวด", costPrice: 35, sellPrice: 45, reorderPoint: 5, initialStock: 12 },
  { sku: "GRO-001", name: "ไข่ไก่เบอร์ 0 (แผง)", category: "ของชำทั่วไป", unit: "แผง", costPrice: 110, sellPrice: 130, reorderPoint: 3, initialStock: 8 },
  { sku: "GRO-002", name: "น้ำแข็งหลอด", category: "ของชำทั่วไป", unit: "ถุง", costPrice: 8, sellPrice: 15, reorderPoint: 10, initialStock: 20 },
  { sku: "SNK-001", name: "ขนมโดนัท", category: "ขนม/ของว่าง", unit: "ชิ้น", costPrice: 6, sellPrice: 10, reorderPoint: 10, initialStock: 24 },
];

function daysAgo(n: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function backdatedSale(params: {
  saleNumber: string;
  cashierId: string;
  paymentMethod: "CASH" | "PROMPTPAY";
  createdAt: Date;
  lines: { sku: string; quantity: number }[];
}) {
  let subtotal = 0;
  const itemsData: {
    productId: string;
    productNameSnapshot: string;
    quantity: number;
    unitPriceSnapshot: number;
    unitCostSnapshot: number;
    lineTotal: number;
    lineCogs: number;
  }[] = [];

  const productUpdates: { id: string; newStock: number; costPrice: number }[] = [];

  for (const line of params.lines) {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: line.sku } });
    const unitPrice = product.sellPrice.toNumber();
    const unitCost = product.costPrice.toNumber();
    const lineTotal = unitPrice * line.quantity;
    const lineCogs = unitCost * line.quantity;
    subtotal += lineTotal;

    itemsData.push({
      productId: product.id,
      productNameSnapshot: product.name,
      quantity: line.quantity,
      unitPriceSnapshot: unitPrice,
      unitCostSnapshot: unitCost,
      lineTotal,
      lineCogs,
    });
    productUpdates.push({
      id: product.id,
      newStock: product.currentStock.toNumber() - line.quantity,
      costPrice: unitCost,
    });
  }

  const cashReceived = params.paymentMethod === "CASH" ? Math.ceil(subtotal / 10) * 10 : undefined;

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        saleNumber: params.saleNumber,
        cashierId: params.cashierId,
        paymentMethod: params.paymentMethod,
        status: "COMPLETED",
        subtotal,
        total: subtotal,
        cashReceived: cashReceived,
        changeGiven: cashReceived ? cashReceived - subtotal : undefined,
        createdAt: params.createdAt,
        items: { create: itemsData },
      },
    });

    for (const u of productUpdates) {
      await tx.product.update({ where: { id: u.id }, data: { currentStock: u.newStock } });
      await tx.stockMovement.create({
        data: {
          productId: u.id,
          type: "SALE_OUT",
          quantity: itemsData.find((i) => i.productId === u.id)!.quantity,
          unitCost: u.costPrice,
          qtyBalanceAfter: u.newStock,
          avgCostBalanceAfter: u.costPrice,
          sourceType: "SALE",
          sourceId: sale.id,
          createdAt: params.createdAt,
        },
      });
    }
  });
}

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: "demo-shop" },
    update: {},
    create: {
      id: "demo-shop",
      name: "ร้านป้าแดง โชห่วย",
      promptPayId: "0812345678",
      promptPayType: "PHONE",
      address: "123 หมู่ 4 ต.บางรัก อ.เมือง จ.สมุทรสาคร",
    },
  });

  const ownerPasswordHash = await hashSecret("owner1234");
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      username: "owner",
      name: "ป้าแดง",
      role: "OWNER",
      passwordHash: ownerPasswordHash,
    },
  });

  const staffPinHash = await hashSecret("1234");
  const staff = await prisma.user.upsert({
    where: { username: "somchai" },
    update: {},
    create: {
      username: "somchai",
      name: "สมชาย",
      role: "STAFF",
      pinHash: staffPinHash,
    },
  });

  const categoryByName = new Map<string, string>();
  for (const name of CATEGORY_NAMES) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryByName.set(name, category.id);
  }

  const existingProductCount = await prisma.product.count();
  if (existingProductCount === 0) {
    for (const p of PRODUCTS) {
      const product = await prisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          categoryId: categoryByName.get(p.category)!,
          unit: p.unit,
          sellPrice: p.sellPrice,
          reorderPoint: p.reorderPoint,
        },
      });

      await prisma.$transaction(async (tx) => {
        const stockIn = await tx.stockIn.create({
          data: {
            supplierName: "ร้านค้าส่งสมุทรสาคร",
            totalCost: p.costPrice * p.initialStock,
            createdById: owner.id,
            createdAt: daysAgo(6, 8),
            items: {
              create: [
                {
                  productId: product.id,
                  quantity: p.initialStock,
                  unitCost: p.costPrice,
                  subtotal: p.costPrice * p.initialStock,
                },
              ],
            },
          },
        });
        await receiveStock(tx, {
          productId: product.id,
          quantity: p.initialStock,
          unitCost: p.costPrice,
          type: "PURCHASE_IN",
          sourceType: "STOCK_IN",
          sourceId: stockIn.id,
        });
      });
    }
  }

  const existingSaleCount = await prisma.sale.count();
  if (existingSaleCount === 0) {
    let saleSeq = 1;
    const nextSaleNumber = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}${m}${d}-${String(saleSeq++).padStart(4, "0")}`;
    };

    const salesPlan: { daysAgo: number; hour: number; cashier: string; lines: { sku: string; quantity: number }[] }[] = [
      { daysAgo: 3, hour: 8, cashier: "staff", lines: [{ sku: "BEV-001", quantity: 2 }, { sku: "NDL-001", quantity: 3 }] },
      { daysAgo: 3, hour: 11, cashier: "owner", lines: [{ sku: "SNK-001", quantity: 4 }] },
      { daysAgo: 3, hour: 17, cashier: "staff", lines: [{ sku: "DAI-001", quantity: 2 }, { sku: "BAK-001", quantity: 1 }] },
      { daysAgo: 2, hour: 9, cashier: "staff", lines: [{ sku: "BEV-002", quantity: 3 }] },
      { daysAgo: 2, hour: 13, cashier: "owner", lines: [{ sku: "NDL-002", quantity: 5 }, { sku: "GRO-002", quantity: 2 }] },
      { daysAgo: 2, hour: 18, cashier: "staff", lines: [{ sku: "SNK-001", quantity: 6 }] },
      { daysAgo: 1, hour: 8, cashier: "staff", lines: [{ sku: "BEV-003", quantity: 4 }, { sku: "NDL-001", quantity: 2 }] },
      { daysAgo: 1, hour: 12, cashier: "owner", lines: [{ sku: "HOM-002", quantity: 1 }] },
      { daysAgo: 1, hour: 16, cashier: "staff", lines: [{ sku: "SNK-001", quantity: 5 }, { sku: "BEV-001", quantity: 3 }] },
      { daysAgo: 1, hour: 19, cashier: "staff", lines: [{ sku: "GRO-001", quantity: 1 }] },
      { daysAgo: 0, hour: 9, cashier: "staff", lines: [{ sku: "BEV-001", quantity: 2 }, { sku: "DAI-001", quantity: 1 }] },
      { daysAgo: 0, hour: 10, cashier: "owner", lines: [{ sku: "SNK-001", quantity: 4 }] },
    ];

    const userIdByRole = { staff: staff.id, owner: owner.id };
    for (const plan of salesPlan) {
      const createdAt = daysAgo(plan.daysAgo, plan.hour, 15);
      await backdatedSale({
        saleNumber: nextSaleNumber(createdAt),
        cashierId: userIdByRole[plan.cashier as "staff" | "owner"],
        paymentMethod: "CASH",
        createdAt,
        lines: plan.lines,
      });
    }
  }

  const expenseCategory = await prisma.expenseCategory.upsert({
    where: { name: "ค่าไฟ/ค่าน้ำ" },
    update: {},
    create: { name: "ค่าไฟ/ค่าน้ำ" },
  });
  const existingExpenseCount = await prisma.expense.count();
  if (existingExpenseCount === 0) {
    await prisma.expense.create({
      data: {
        categoryId: expenseCategory.id,
        amount: 450,
        description: "ค่าไฟฟ้าประจำเดือน",
        paymentMethod: "CASH",
        incurredAt: daysAgo(2, 19),
        createdById: owner.id,
      },
    });
  }

  const existingDrawCount = await prisma.ownerDraw.count();
  if (existingDrawCount === 0) {
    await prisma.ownerDraw.create({
      data: {
        amount: 300,
        method: "CASH",
        reason: "ค่าใช้จ่ายส่วนตัว",
        takenById: owner.id,
        takenAt: daysAgo(1, 20),
      },
    });
  }

  const existingCapexCount = await prisma.capexItem.count();
  if (existingCapexCount === 0) {
    await prisma.capexItem.create({
      data: {
        name: "ตู้แช่เย็น",
        categoryLabel: "อุปกรณ์",
        amount: 15000,
        purchaseDate: daysAgo(180),
        usefulLifeMonths: 60,
        createdById: owner.id,
      },
    });
    await prisma.capexItem.create({
      data: {
        name: "ชั้นวางสินค้า",
        categoryLabel: "ตกแต่งร้าน",
        amount: 6000,
        purchaseDate: daysAgo(180),
        createdById: owner.id,
      },
    });
  }

  console.log({
    shop: shop.name,
    owner: owner.username,
    staff: staff.username,
    products: PRODUCTS.length,
    sales: existingSaleCount === 0 ? "seeded" : "already present, skipped",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
