import { prisma } from "@/lib/prisma";
import { ShopSettingsForm } from "./ShopSettingsForm";

export default async function SettingsPage() {
  const shop = await prisma.shop.findFirst();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-lg font-semibold text-stone-900">ตั้งค่าร้าน</h1>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <ShopSettingsForm shop={shop} />
      </div>
    </div>
  );
}
