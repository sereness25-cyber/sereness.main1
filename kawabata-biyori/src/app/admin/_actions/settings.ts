"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, AdminError } from "@/lib/admin/auth";

const url = z.string().url().or(z.literal(""));
const siteInput = z.object({ instagram: url, x: url, facebook: url, youtube: url });
const aiInput = z.object({
  text_model: z.string().trim().min(1).max(60),
  effort: z.enum(["low", "medium", "high"]),
  image_model: z.string().trim().min(1).max(60),
  daily_limit: z.number().int().min(1).max(1000),
});

export async function saveSiteSettings(raw: z.infer<typeof siteInput>) {
  return runAction(async ({ supabase }) => {
    const parsed = siteInput.safeParse(raw);
    if (!parsed.success) throw new AdminError("URLの形式を確認してください（https:// から始まるURL）。", 400);
    const { error } = await supabase.from("site_settings").upsert({ key: "site", value: parsed.data, updated_at: new Date().toISOString() });
    if (error) throw new AdminError(`保存に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}

export async function saveAiSettings(raw: z.infer<typeof aiInput>) {
  return runAction(async ({ supabase }) => {
    const parsed = aiInput.safeParse(raw);
    if (!parsed.success) throw new AdminError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。", 400);
    const { error } = await supabase.from("site_settings").upsert({ key: "ai", value: parsed.data, updated_at: new Date().toISOString() });
    if (error) throw new AdminError(`保存に失敗しました: ${error.message}`, 500);
  });
}

export async function deleteContactMessage(id: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`削除に失敗しました: ${error.message}`, 500);
    revalidatePath("/admin/contact");
  });
}
