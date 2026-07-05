/** Apify REST API 的最小封裝：啟動 actor run、輪詢完成、取回 dataset items */

const API = "https://api.apify.com/v2";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runActor<T>(
  token: string,
  actorId: string,
  input: unknown,
  { timeoutMin = 15 }: { timeoutMin?: number } = {},
): Promise<T[]> {
  const startRes = await fetch(
    `${API}/acts/${actorId.replace("/", "~")}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!startRes.ok)
    throw new Error(`Apify 啟動 ${actorId} 失敗：${startRes.status} ${await startRes.text()}`);
  const run = (await startRes.json()).data;

  const deadline = Date.now() + timeoutMin * 60_000;
  let status = run.status;
  while (["READY", "RUNNING"].includes(status)) {
    if (Date.now() > deadline) throw new Error(`Apify run ${run.id} 逾時`);
    await sleep(10_000);
    const res = await fetch(`${API}/actor-runs/${run.id}?token=${token}`);
    status = (await res.json()).data.status;
  }
  if (status !== "SUCCEEDED")
    throw new Error(`Apify run ${run.id} 結束狀態：${status}`);

  const itemsRes = await fetch(
    `${API}/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`,
  );
  if (!itemsRes.ok) throw new Error(`取回 dataset 失敗：${itemsRes.status}`);
  return itemsRes.json();
}
