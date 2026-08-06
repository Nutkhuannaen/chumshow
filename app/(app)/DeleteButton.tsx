"use client";

import { useActionState, useState } from "react";

type ActionState = { error?: string } | undefined;

export function DeleteButton({
  action,
  label = "ลบ",
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-red-600 hover:underline">
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="text-xs text-stone-500">ลบแน่ใจไหม?</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
      >
        {pending ? "กำลังลบ..." : "ยืนยัน"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-stone-400 hover:underline">
        ยกเลิก
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
