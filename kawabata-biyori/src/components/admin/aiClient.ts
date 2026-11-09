"use client";

/** 管理画面からAI APIを呼ぶ。エラー時は日本語メッセージで例外を投げる */
export async function callAi<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin/ai/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("通信できませんでした。ネットワークを確認してください。");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `エラーが発生しました（${res.status}）。`);
  return json as T;
}
