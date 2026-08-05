"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategory, deleteCategory, type ActionState } from "./actions";

export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createCategory, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="name"
          placeholder="ชื่อหมวดหมู่ใหม่ เช่น เครื่องดื่ม"
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
        {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        เพิ่ม
      </button>
    </form>
  );
}

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(deleteCategory, undefined);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="categoryId" value={categoryId} />
      <button type="submit" disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-40">
        ลบ
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
