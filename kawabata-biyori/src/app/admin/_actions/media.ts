"use server";

import { z } from "zod";
import { runAction, AdminError } from "@/lib/admin/auth";

export async function updateMediaAlt(id: string, alt: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("media").update({ alt: z.string().max(200).parse(alt) }).eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`保存に失敗しました: ${error.message}`, 500);
  });
}

export async function deleteMedia(id: string) {
  return runAction(async ({ supabase }) => {
    const { data, error } = await supabase.from("media").select("path").eq("id", z.string().uuid().parse(id)).single();
    if (error) throw new AdminError("画像が見つかりません。", 404);
    const { error: e1 } = await supabase.storage.from("media").remove([data.path]);
    if (e1) throw new AdminError(`ファイルの削除に失敗しました: ${e1.message}`, 500);
    await supabase.from("media").delete().eq("id", id);
  });
}

export async function signOut() {
  return runAction(async ({ supabase }) => {
    await supabase.auth.signOut();
  });
}
