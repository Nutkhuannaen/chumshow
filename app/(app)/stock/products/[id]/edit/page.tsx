import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../ProductForm";
import { updateProduct } from "../../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900">แก้ไขสินค้า</h1>
        <Link href="/stock" className="text-sm text-stone-500 hover:underline">
          ← กลับไปหน้าสต็อก
        </Link>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <ProductForm
          categories={categories}
          action={updateProduct.bind(null, product.id)}
          submitLabel="บันทึกการแก้ไข"
          initialValues={{
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            categoryId: product.categoryId,
            unit: product.unit,
            sellPrice: product.sellPrice.toString(),
            reorderPoint: product.reorderPoint.toString(),
            isActive: product.isActive,
          }}
        />
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
        <p>
          คงเหลือปัจจุบัน: <span className="font-medium text-stone-900">{product.currentStock.toString()} {product.unit}</span>
        </p>
        <p className="mt-1">
          ต้นทุนเฉลี่ยต่อหน่วย: <span className="font-medium text-stone-900">฿{product.costPrice.toString()}</span>
        </p>
        <p className="mt-2 text-xs text-stone-400">
          แก้ไขคงเหลือ/ต้นทุนไม่ได้โดยตรง — ใช้หน้า &quot;รับสินค้าเข้า&quot; หรือ &quot;ปรับปรุงสต็อก&quot; แทน เพื่อให้ประวัติต้นทุนถูกต้อง
        </p>
      </div>
    </div>
  );
}
