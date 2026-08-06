import { prisma } from "@/lib/prisma";
import { ShopSettingsForm } from "./ShopSettingsForm";
import { ResetShopSection } from "./ResetShopSection";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const [shop, sp] = await Promise.all([prisma.shop.findFirst(), searchParams]);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-lg font-semibold text-stone-900">ตั้งค่าร้าน</h1>

      {sp.reset === "1" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          รีเซ็ตร้านเรียบร้อยแล้ว ข้อมูลกลับไปเป็นค่าเริ่มต้นของร้านใหม่แล้ว
        </p>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <ShopSettingsForm shop={shop} />
      </div>

      <ResetShopSection />
    </div>
  );
}
