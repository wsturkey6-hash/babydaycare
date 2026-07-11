/**
 * 判斷貼文/網頁文字是否為招生資訊。
 * 啟發式關鍵字比對：有正向訊號且非「已額滿/停招」；
 * 但額滿仍開放候補/報名時，家長仍可行動，視為招生資訊。
 */

export const RECRUITING_KEYWORDS =
  /(招生|招收|名額|缺額|收托(?!人數)|報名|候補|預約參觀|開放參觀)/;
const POSITIVE = RECRUITING_KEYWORDS;
const CLOSED = /(額滿|已滿|滿班|停止招生|暫停招生|停止收托|暫停收托|停托)/;
const ACTIONABLE = /(候補|報名|預約參觀)/;

export function isRecruitingText(text: string): boolean {
  if (!POSITIVE.test(text)) return false;
  if (CLOSED.test(text) && !ACTIONABLE.test(text)) return false;
  return true;
}
