"use client";

import { useActionState, useState } from "react";
import { ownerLogin, staffLogin, type LoginState } from "./actions";

type StaffOption = { username: string; name: string };

const PIN_MAX_LENGTH = 6;

export function LoginForm({ staff }: { staff: StaffOption[] }) {
  const [tab, setTab] = useState<"staff" | "owner">("staff");

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-stone-200 p-1">
        <button
          type="button"
          onClick={() => setTab("staff")}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            tab === "staff" ? "bg-white text-stone-900 shadow" : "text-stone-500"
          }`}
        >
          พนักงาน
        </button>
        <button
          type="button"
          onClick={() => setTab("owner")}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            tab === "owner" ? "bg-white text-stone-900 shadow" : "text-stone-500"
          }`}
        >
          เจ้าของร้าน
        </button>
      </div>

      {tab === "staff" ? <StaffLogin staff={staff} /> : <OwnerLogin />}
    </div>
  );
}

function StaffLogin({ staff }: { staff: StaffOption[] }) {
  const [selected, setSelected] = useState<StaffOption | null>(null);
  const [pin, setPin] = useState("");
  const [state, formAction, pending] = useActionState<LoginState, FormData>(staffLogin, undefined);

  if (!selected) {
    return (
      <div>
        {staff.length === 0 ? (
          <p className="text-center text-sm text-stone-500">ยังไม่มีบัญชีพนักงาน</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {staff.map((member) => (
              <button
                key={member.username}
                type="button"
                onClick={() => {
                  setSelected(member);
                  setPin("");
                }}
                className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white text-stone-800 shadow-sm active:scale-95 transition"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                  {member.name.slice(0, 1)}
                </span>
                <span className="text-sm font-medium">{member.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="username" value={selected.username} />
      <input type="hidden" name="pin" value={pin} />

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-sm text-stone-500"
        >
          ← เปลี่ยนคน
        </button>
        <span className="text-sm font-medium text-stone-800">{selected.name}</span>
      </div>

      <div className="mb-4 flex justify-center gap-2">
        {Array.from({ length: PIN_MAX_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border border-stone-400 ${
              i < pin.length ? "bg-stone-800 border-stone-800" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {state?.error && (
        <p className="mb-3 text-center text-sm text-red-600">{state.error}</p>
      )}

      <PinPad
        value={pin}
        onChange={setPin}
        disabled={pending}
        onSubmit={() => {
          // form submits via the button below once pin length is valid
        }}
      />

      <button
        type="submit"
        disabled={pin.length < 4 || pending}
        className="mt-4 w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

function PinPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onSubmit?: () => void;
}) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="grid grid-cols-3 gap-2">
      {digits.map((d, i) => {
        if (d === "") return <div key={i} />;
        if (d === "⌫") {
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.slice(0, -1))}
              className="h-14 rounded-xl bg-stone-100 text-lg font-medium text-stone-600 active:scale-95 transition"
            >
              ⌫
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            disabled={disabled || value.length >= PIN_MAX_LENGTH}
            onClick={() => onChange(value + d)}
            className="h-14 rounded-xl bg-stone-100 text-xl font-semibold text-stone-800 active:scale-95 transition disabled:opacity-40"
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

function OwnerLogin() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(ownerLogin, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">ชื่อผู้ใช้</label>
        <input
          name="username"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">รหัสผ่าน</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
