"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { publicClient } from "@/lib/supabase/public";

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(1, "お名前を入力してください。").max(100, "100文字以内で入力してください。"),
  email: z.string().trim().email("メールアドレスの形式をご確認ください。").max(200),
  subject: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(1, "お問い合わせ内容を入力してください。").max(4000, "4000文字以内で入力してください。"),
  agree: z.literal("on", { message: "プライバシーポリシーへの同意が必要です。" }),
});

export async function sendContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  if (form.get("website")) return { ok: true, message: "送信しました。" }; // スパム対策（ハニーポット）
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "入力内容をご確認ください。", errors };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "現在お問い合わせフォームの準備中です（データベース未接続）。" };
  }
  const { name, email, subject, body } = parsed.data;
  const { error } = await publicClient().from("contact_messages").insert({ name, email, subject, body });
  if (error) return { ok: false, message: "送信に失敗しました。時間をおいて、もう一度お試しください。" };
  return { ok: true, message: "お問い合わせを受け付けました。内容を確認のうえ、ご連絡いたします。" };
}
