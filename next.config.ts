import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 全靜態輸出（GitHub Pages 部署用），產物在 out/
  output: "export",
  // GitHub Pages 專案網址掛在 /<repo> 底下；本地開發不設此環境變數
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export default nextConfig;
