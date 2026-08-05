import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashSecret } from "../lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  console.log({ shop: shop.name, owner: owner.username, staff: staff.username });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
