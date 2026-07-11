import { describe, expect, test } from "vitest";
import { isRecruitingText } from "./recruiting";

describe("isRecruitingText", () => {
  test.each([
    "【招生中】8月份尚有 2 個名額，歡迎預約參觀！",
    "115學年度招生開跑，0-2歲收托報名中",
    "目前有少量缺額，歡迎來電洽詢",
    "開放候補登記，額滿為止",
    "歡迎預約參觀，尚有名額",
  ])("招生訊號 → true：%s", (text) => {
    expect(isRecruitingText(text)).toBe(true);
  });

  test.each([
    "端午節親子活動照片分享",
    "感謝家長參與運動會",
    "本中心榮獲評鑑甲等",
    "夏季作息時間調整公告",
  ])("無關貼文 → false：%s", (text) => {
    expect(isRecruitingText(text)).toBe(false);
  });

  test.each([
    "目前名額已滿，感謝支持",
    "114年度已額滿，暫停招生",
    "滿班公告：目前無收托名額",
  ])("已額滿/停止招生 → false：%s", (text) => {
    expect(isRecruitingText(text)).toBe(false);
  });

  test("已額滿但開放候補 → true（家長仍可行動）", () => {
    expect(isRecruitingText("名額已滿，開放候補登記")).toBe(true);
  });
});

describe("isRecruitingText 颱風/停托公告", () => {
  test.each([
    "依據新竹縣政府公告，因受颱風影響，明日停止收托一日",
    "明天放颱風假，中心停止收托，颱風天乖乖在家",
    "本週六暫停收托，造成不便敬請見諒",
  ])("停托公告 → false：%s", (text) => {
    expect(isRecruitingText(text)).toBe(false);
  });

  test("貼文尾註「熱烈招生中」→ true", () => {
    expect(isRecruitingText("活動花絮分享 💕貝果托嬰中心熱烈招生中💕")).toBe(true);
  });
});
