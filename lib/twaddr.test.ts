import { describe, expect, test } from "vitest";
import { parseTwAddress } from "./twaddr";

describe("parseTwAddress", () => {
  test("基本：縣市+區+里+路+號", () => {
    expect(parseTwAddress("新竹市北區西雅里民富街256號1樓")).toEqual({
      city: "新竹市",
      street: "民富街",
      number: "256",
    });
  });

  test("多門牌取第一個", () => {
    expect(parseTwAddress("新竹縣竹北市斗崙里福興路1023、1025號")).toEqual({
      city: "竹北市",
      street: "福興路",
      number: "1023",
    });
  });

  test("路名含段", () => {
    expect(parseTwAddress("新竹縣竹東鎮二重里中興路三段390號1-2樓")).toEqual({
      city: "竹東鎮",
      street: "中興路三段",
      number: "390",
    });
  });

  test("巷為路名一部分", () => {
    expect(parseTwAddress("新竹市東區建華里東南街188巷13號1樓")).toEqual({
      city: "新竹市",
      street: "東南街188巷",
      number: "13",
    });
  });

  test("巷弄與帶連字號門牌", () => {
    expect(
      parseTwAddress("新竹縣橫山鄉大肚村永昌街123巷1弄15-1號1~3樓"),
    ).toEqual({
      city: "橫山鄉",
      street: "永昌街123巷1弄",
      number: "15-1",
    });
  });

  test("路名含方位段（縣政二路南段）", () => {
    expect(parseTwAddress("新竹縣竹北市斗崙里縣政二路南段62、66、68號")).toEqual({
      city: "竹北市",
      street: "縣政二路南段",
      number: "62",
    });
  });

  test("無法解析回傳 null", () => {
    expect(parseTwAddress("新竹縣寶山鄉某某段123地號")).toBeNull();
  });
});
