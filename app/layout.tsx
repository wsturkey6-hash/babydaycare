import type { Metadata, Viewport } from "next";
import { LXGW_WenKai_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
});

const wenkai = LXGW_WenKai_TC({
  variable: "--font-wenkai",
  weight: ["400", "700"],
  subsets: ["lisu"],
});

export const metadata: Metadata = {
  title: "竹托地圖｜新竹托嬰中心搜尋",
  description:
    "新竹市與新竹縣托嬰中心地圖：招生資訊、裁罰紀錄、評鑑與準公共化資格，一張地圖看完。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 頁面底色（--paper），讓行動裝置瀏覽器 UI 融入背景；不鎖縮放以維持無障礙
  themeColor: "#f9f1e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant-TW"
      className={`${notoSansTC.variable} ${wenkai.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden">{children}</body>
    </html>
  );
}
