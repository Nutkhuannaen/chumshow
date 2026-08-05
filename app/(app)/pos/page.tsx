import { auth } from "@/auth";

export default async function PosPage() {
  const session = await auth();

  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <p className="text-sm text-stone-500">
        สวัสดีคุณ {session?.user.name} — หน้าขายสินค้ากำลังจะมาเร็วๆ นี้
      </p>
    </div>
  );
}
