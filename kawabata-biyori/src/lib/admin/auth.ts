import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { serverClient } from "@/lib/supabase/server";

export type AdminSession = { supabase: SupabaseClient; user: User };

/** ログイン中かつ admin_profiles に登録された管理者なら返す。そうでなければ null */
export async function getAdmin(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("admin_profiles").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return profile ? { supabase, user: data.user } : null;
}

/** 管理画面のページ用。未ログインならログイン画面へ */
export async function requireAdminPage(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) return null; // デモモード：閲覧のみ
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class AdminError extends Error {
  constructor(message: string, public status = 403) {
    super(message);
  }
}

/** Server Action / API 用。書き込み前に必ず呼ぶ */
export async function requireAdmin(): Promise<AdminSession> {
  if (!isSupabaseConfigured()) throw new AdminError("データベースが未接続のため保存できません（デモモード）。", 503);
  const admin = await getAdmin();
  if (!admin) throw new AdminError("管理者としてログインしてください。", 401);
  return admin;
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

export async function runAction<T>(fn: (admin: AdminSession) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const admin = await requireAdmin();
    return { ok: true, data: await fn(admin) };
  } catch (e) {
    if (e instanceof AdminError) return { ok: false, error: e.message };
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect() などはそのまま投げる
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "処理に失敗しました。" };
  }
}
