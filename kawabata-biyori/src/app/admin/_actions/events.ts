"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, AdminError } from "@/lib/admin/auth";
import { sanitizeArticleHtml, slugify } from "@/lib/html";

const eventInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "イベント名を入力してください。").max(150),
  slug: z.string().trim().max(80),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).nullable(),
  venue: z.string().trim().max(200),
  fee: z.string().trim().max(200),
  content: z.string().max(100_000),
  organizer: z.string().trim().max(200),
  how_to_apply: z.string().trim().max(500),
  image: z.string().url().nullable(),
  image_alt: z.string().trim().max(200),
  is_published: z.boolean(),
});
export type EventInput = z.infer<typeof eventInput>;

export async function saveEvent(raw: EventInput) {
  return runAction(async ({ supabase }) => {
    const parsed = eventInput.safeParse(raw);
    if (!parsed.success) throw new AdminError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。", 400);
    const v = parsed.data;
    if (v.ends_at && new Date(v.ends_at) < new Date(v.starts_at)) throw new AdminError("終了日時は開始日時より後にしてください。", 400);
    const { id, ...row } = { ...v, slug: slugify(v.slug || v.title), content: sanitizeArticleHtml(v.content) };
    const q = id ? supabase.from("events").update(row).eq("id", id).select("id").single() : supabase.from("events").insert(row).select("id").single();
    const { data, error } = await q;
    if (error) throw new AdminError(error.code === "23505" ? "このURLスラッグは使われています。" : `保存に失敗しました: ${error.message}`, 400);
    revalidatePath("/", "layout");
    return { id: data.id as string };
  });
}

export async function deleteEvent(id: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("events").delete().eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`削除に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}
