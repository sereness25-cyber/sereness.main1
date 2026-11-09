"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { btnPrimary, input } from "@/components/admin/ui";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError("");
        const f = new FormData(e.currentTarget);
        const { error } = await browserClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
        setPending(false);
        if (error) return setError("メールアドレスかパスワードが違います。");
        router.replace("/admin");
        router.refresh();
      }}
    >
      {error && <p role="alert" className="rounded-xl bg-[#fbecee] px-3 py-2 text-sm text-[#8a1c30]">{error}</p>}
      <label className="block text-sm font-bold text-navy">メールアドレス<input name="email" type="email" autoComplete="username" required className={`${input} mt-1`} /></label>
      <label className="block text-sm font-bold text-navy">パスワード<input name="password" type="password" autoComplete="current-password" required className={`${input} mt-1`} /></label>
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>{pending ? "確認しています…" : "ログイン"}</button>
      <p className="text-xs text-muted">管理者アカウントは Supabase で作成し、admin_profiles に登録したものだけが使えます。</p>
    </form>
  );
}
