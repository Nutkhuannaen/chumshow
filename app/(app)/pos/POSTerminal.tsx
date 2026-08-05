"use client";

import { useActionState, useMemo, useState } from "react";
import { checkout, checkoutPromptPay, type ActionState } from "./actions";

type Product = {
  id: string;
  name: string;
  unit: string;
  sellPrice: number;
  currentStock: number;
  barcode: string | null;
  sku: string | null;
  categoryName: string | null;
};

type CartLine = { productId: string; qty: number };

const QUICK_CASH = [20, 50, 100, 500, 1000];

export function POSTerminal({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [step, setStep] = useState<"cart" | "payment">("cart");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "PROMPTPAY">("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(checkout, undefined);
  const [ppState, ppFormAction, ppPending] = useActionState<ActionState, FormData>(
    checkoutPromptPay,
    undefined,
  );

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase() === q ||
        p.sku?.toLowerCase().includes(q),
    );
  }, [products, search]);

  const cartWithDetails = cart
    .map((line) => ({ ...line, product: productById.get(line.productId) }))
    .filter((l): l is CartLine & { product: Product } => !!l.product);

  const total = cartWithDetails.reduce((sum, l) => sum + l.product.sellPrice * l.qty, 0);
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      const currentQty = existing?.qty ?? 0;
      if (currentQty + 1 > product.currentStock) return prev;
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { productId: product.id, qty: 1 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    const product = productById.get(productId);
    if (!product) return;
    const clamped = Math.max(0, Math.min(qty, product.currentStock));
    setCart((prev) =>
      clamped === 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty: clamped } : l)),
    );
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = search.trim().toLowerCase();
    if (!q) return;
    const exact = products.find((p) => p.barcode?.toLowerCase() === q);
    if (exact) {
      addToCart(exact);
      setSearch("");
    } else if (filtered.length === 1) {
      addToCart(filtered[0]);
      setSearch("");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="ค้นหาสินค้า หรือสแกนบาร์โค้ด..."
          autoFocus
          className="mb-4 w-full rounded-xl border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((p) => {
            const outOfStock = p.currentStock <= 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className="flex flex-col items-start rounded-xl border border-stone-200 bg-white p-3 text-left shadow-sm active:scale-95 transition disabled:opacity-40"
              >
                <span className="text-sm font-medium text-stone-800 line-clamp-2">{p.name}</span>
                <span className="mt-1 text-xs text-stone-400">{p.categoryName ?? "—"}</span>
                <div className="mt-2 flex w-full items-center justify-between">
                  <span className="text-sm font-semibold text-stone-900">฿{p.sellPrice.toFixed(2)}</span>
                  <span className={`text-xs ${outOfStock ? "text-red-500" : "text-stone-400"}`}>
                    {outOfStock ? "หมด" : `เหลือ ${p.currentStock} ${p.unit}`}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-stone-400">ไม่พบสินค้า</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        {step === "cart" ? (
          <>
            <h2 className="mb-3 text-sm font-semibold text-stone-700">ตะกร้าสินค้า</h2>
            {cartWithDetails.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">ยังไม่มีสินค้าในตะกร้า</p>
            ) : (
              <div className="space-y-3">
                {cartWithDetails.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800 line-clamp-1">{l.product.name}</p>
                      <p className="text-xs text-stone-400">
                        ฿{l.product.sellPrice.toFixed(2)} × {l.qty} = ฿{(l.product.sellPrice * l.qty).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQty(l.productId, l.qty - 1)}
                        className="h-7 w-7 rounded-lg bg-stone-100 text-stone-600"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{l.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(l.productId, l.qty + 1)}
                        disabled={l.qty >= l.product.currentStock}
                        className="h-7 w-7 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3">
              <span className="text-sm text-stone-500">ยอดรวม</span>
              <span className="text-lg font-bold text-stone-900">฿{total.toFixed(2)}</span>
            </div>
            <button
              type="button"
              disabled={cartWithDetails.length === 0}
              onClick={() => setStep("payment")}
              className="mt-4 w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              ชำระเงิน
            </button>
          </>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setStep("cart")}
              className="mb-3 text-sm text-stone-500"
            >
              ← แก้ไขตะกร้า
            </button>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-500">ยอดที่ต้องชำระ</span>
              <span className="text-xl font-bold text-stone-900">฿{total.toFixed(2)}</span>
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  paymentMethod === "CASH" ? "bg-white text-stone-900 shadow" : "text-stone-500"
                }`}
              >
                เงินสด
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("PROMPTPAY")}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  paymentMethod === "PROMPTPAY" ? "bg-white text-stone-900 shadow" : "text-stone-500"
                }`}
              >
                พร้อมเพย์
              </button>
            </div>

            {paymentMethod === "CASH" ? (
              <form action={formAction}>
                {cartWithDetails.map((l) => (
                  <div key={l.productId}>
                    <input type="hidden" name="productId" value={l.productId} />
                    <input type="hidden" name="quantity" value={l.qty} />
                  </div>
                ))}

                <label className="mb-1 block text-sm font-medium text-stone-700">รับเงินสด (บาท)</label>
                <input
                  name="cashReceived"
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-base focus:border-stone-500 focus:outline-none"
                />
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_CASH.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashReceived(String(amt))}
                      className="rounded-lg bg-stone-100 px-3 py-1 text-xs text-stone-600"
                    >
                      ฿{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived(total.toFixed(0))}
                    className="rounded-lg bg-stone-100 px-3 py-1 text-xs text-stone-600"
                  >
                    พอดี
                  </button>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                  <span className="text-sm text-stone-500">เงินทอน</span>
                  <span className={`text-base font-semibold ${change < 0 ? "text-red-600" : "text-stone-900"}`}>
                    ฿{change.toFixed(2)}
                  </span>
                </div>

                {state?.error && <p className="mb-3 text-sm text-red-600">{state.error}</p>}

                <button
                  type="submit"
                  disabled={pending || change < 0}
                  className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "กำลังบันทึก..." : "ยืนยันการขาย"}
                </button>
              </form>
            ) : (
              <form action={ppFormAction}>
                {cartWithDetails.map((l) => (
                  <div key={l.productId}>
                    <input type="hidden" name="productId" value={l.productId} />
                    <input type="hidden" name="quantity" value={l.qty} />
                  </div>
                ))}

                <p className="mb-4 text-sm text-stone-500">
                  ระบบจะสร้าง QR พร้อมเพย์ยอด ฿{total.toFixed(2)} ให้ลูกค้าสแกน แล้วกดยืนยันเมื่อได้รับเงินแล้ว
                </p>

                {ppState?.error && <p className="mb-3 text-sm text-red-600">{ppState.error}</p>}

                <button
                  type="submit"
                  disabled={ppPending}
                  className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {ppPending ? "กำลังสร้าง QR..." : "สร้าง QR พร้อมเพย์"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
