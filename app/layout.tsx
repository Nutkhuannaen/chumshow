import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ChumShow — POS ร้านโชห่วย",
  description: "ระบบขายหน้าร้าน สต็อก และกำไร-ขาดทุน สำหรับร้านโชห่วยไทย",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50 font-sans">{children}</body>
    </html>
  );
}
