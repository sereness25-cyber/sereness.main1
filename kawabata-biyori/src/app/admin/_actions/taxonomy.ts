"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, AdminError } from "@/lib/admin/auth";
import { slugify } from "@/lib/html";

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "名前を入力してください。").max(40),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "スラッグは半角英小文字・数字・ハイフンで入力してください。").max(40),
  description: z.string().trim().max(300),
  image: z.string().url().nullable(),
});

export async function saveCategory(raw: z.infer<typeof categoryInput>) {
  return runAction(async ({ supabase }) => {
    const parsed = categoryInput.safeParse(raw);
    if (!parsed.success) throw new AdminError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。", 400);
    const { id, ...row } = parsed.data;
    if (id) {
      const { error } = await supabase.from("categories").update(row).eq("id", id);
      if (error) throw new AdminError(`保存に失敗しました: ${error.message}`, 400);
    } else {
      const { count } = await supabase.from("categories").select("id", { count: "exact", head: true });
      const { error } = await supabase.from("categories").insert({ ...row, sort_order: (count ?? 0) + 1 });
      if (error) throw new AdminError(error.code === "23505" ? "このスラッグは使われています。" : `保存に失敗しました: ${error.message}`, 400);
    }
    revalidatePath("/", "layout");
  });
}

export async function deleteCategory(id: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("categories").delete().eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`削除に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}

/** 並び替え：渡された順に sort_order を振り直す */
export async function reorderCategories(ids: string[]) {
  return runAction(async ({ supabase }) => {
    const list = z.array(z.string().uuid()).parse(ids);
    for (const [i, id] of list.entries()) {
      const { error } = await supabase.from("categories").update({ sort_order: i + 1 }).eq("id", id);
      if (error) throw new AdminError(`並び替えに失敗しました: ${error.message}`, 500);
    }
    revalidatePath("/", "layout");
  });
}

const tagInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "名前を入力してください。").max(30),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "スラッグは半角英小文字・数字・ハイフンで入力してください。").max(40),
});

export async function saveTag(raw: z.infer<typeof tagInput>) {
  return runAction(async ({ supabase }) => {
    const parsed = tagInput.safeParse(raw);
    if (!parsed.success) throw new AdminError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。", 400);
    const { id, ...row } = parsed.data;
    const { error } = id ? await supabase.from("tags").update(row).eq("id", id) : await supabase.from("tags").insert(row);
    if (error) throw new AdminError(error.code === "23505" ? "このスラッグは使われています。" : `保存に失敗しました: ${error.message}`, 400);
    revalidatePath("/", "layout");
  });
}

export async function deleteTag(id: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("tags").delete().eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`削除に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}
