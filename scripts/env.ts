import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** 讀取專案根目錄的 .env.local（本地執行用；CI 直接吃環境變數） */
export function loadEnvLocal(): void {
  const path = join(import.meta.dirname, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
