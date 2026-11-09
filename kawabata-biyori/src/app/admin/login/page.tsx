import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "ログイン" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-soft">
        <p className="text-center font-maru text-xl font-bold text-navy">かわばた日和</p>
        <p className="mb-6 text-center font-en text-xs tracking-[0.3em] text-rose-deep">ADMIN</p>
        {isSupabaseConfigured() ? (
          <LoginForm />
        ) : (
          <p className="text-sm leading-7">Supabase が未接続のため、ログインは使えません。<a href="/admin" className="underline">デモモードで管理画面を見る</a></p>
        )}
      </div>
    </div>
  );
}
