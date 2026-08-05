import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">เพิ่มสินค้าใหม่</h1>
        <Link href="/stock" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าสต็อก
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <ProductForm categories={categories} action={createProduct} submitLabel="เพิ่มสินค้า" />
      </div>
    </div>
  );
}
