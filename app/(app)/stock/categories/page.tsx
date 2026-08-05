import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddCategoryForm, DeleteCategoryButton } from "./CategoryForms";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">หมวดหมู่สินค้า</h1>
        <Link href="/stock" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าสต็อก
        </Link>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <AddCategoryForm />
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">ชื่อหมวดหมู่</th>
              <th className="px-4 py-2 font-medium">จำนวนสินค้า</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-stone-400">
                  ยังไม่มีหมวดหมู่
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-stone-800">{c.name}</td>
                  <td className="px-4 py-2 text-stone-500">{c._count.products}</td>
                  <td className="px-4 py-2 text-right">
                    <DeleteCategoryButton categoryId={c.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
