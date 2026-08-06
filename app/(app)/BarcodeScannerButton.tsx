"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

export function BarcodeScannerButton({ onScan }: { onScan: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, _err, controls) => {
          controlsRef.current = controls;
          if (cancelled || !result) return;
          controls.stop();
          onScanRef.current(result.getText());
          setOpen(false);
        },
      )
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = e instanceof Error ? e.name : "";
        setError(
          name === "NotAllowedError"
            ? "กรุณาอนุญาตให้เข้าถึงกล้องเพื่อสแกนบาร์โค้ด"
            : "ไม่สามารถเปิดกล้องได้ — อุปกรณ์นี้อาจไม่รองรับ หรือไม่มีกล้อง",
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label="สแกนบาร์โค้ดด้วยกล้อง"
        title="สแกนบาร์โค้ดด้วยกล้อง"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-600 active:scale-95 transition"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path
            d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M7 8v8M10 8v8M13 8v8M16 8v8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />
          </div>

          {error ? (
            <p className="mt-4 max-w-sm text-center text-sm text-red-300">{error}</p>
          ) : (
            <p className="mt-4 text-sm text-white/70">เล็งกล้องไปที่บาร์โค้ดสินค้า</p>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-stone-900"
          >
            ปิดกล้อง
          </button>
        </div>
      )}
    </>
  );
}
