"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, AdminError } from "@/lib/admin/auth";
import { slugify } from "@/lib/html";

const opt = z.string().trim().max(500);
const shopInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "店舗名を入力してください。").max(100),
  slug: z.string().trim().max(80),
  category: z.enum(["izakaya", "bar", "snack", "dining", "karaoke", "other"]),
  description: z.string().trim().max(3000),
  address: opt,
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  business_hours: opt,
  closed_days: opt,
  price_range: opt,
  budget_level: z.number().int().min(1).max(4).nullable(),
  payment_methods: opt,
  seats: opt,
  solo_ok: z.boolean().nullable(),
  non_alcohol: z.boolean().nullable(),
  beginner_welcome: z.boolean(),
  sns: z.object({ instagram: z.string().url().or(z.literal("")), x: z.string().url().or(z.literal("")), facebook: z.string().url().or(z.literal("")), youtube: z.string().url().or(z.literal("")) }),
  website: z.string().url().nullable(),
  image: z.string().url().nullable(),
  image_alt: z.string().trim().max(200),
  photo_permission: z.boolean(),
  verified_at: z.string().date().nullable(),
  is_published: z.boolean(),
});
export type ShopInput = z.infer<typeof shopInput>;

export async function saveShop(raw: ShopInput) {
  return runAction(async ({ supabase }) => {
    const parsed = shopInput.safeParse(raw);
    if (!parsed.success) throw new AdminError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。", 400);
    const v = parsed.data;
    if (v.is_published && !v.verified_at) throw new AdminError("公開するには情報の最終確認日を入力してください。", 400);
    if (v.image && !v.photo_permission) throw new AdminError("店舗写真を使う場合は、写真使用許可の確認にチェックを入れてください。", 400);
    const { id, ...row } = { ...v, slug: slugify(v.slug || v.name) };
    const q = id ? supabase.from("shops").update(row).eq("id", id).select("id").single() : supabase.from("shops").insert(row).select("id").single();
    const { data, error } = await q;
    if (error) throw new AdminError(error.code === "23505" ? "このURLスラッグは使われています。" : `保存に失敗しました: ${error.message}`, 400);
    revalidatePath("/", "layout");
    return { id: data.id as string };
  });
}

export async function deleteShop(id: string) {
  return runAction(async ({ supabase }) => {
    const { error } = await supabase.from("shops").delete().eq("id", z.string().uuid().parse(id));
    if (error) throw new AdminError(`削除に失敗しました: ${error.message}`, 500);
    revalidatePath("/", "layout");
  });
}
