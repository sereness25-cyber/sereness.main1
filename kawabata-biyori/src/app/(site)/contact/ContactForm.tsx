"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { ok: false, message: "" });
  if (state.ok) {
    return <p role="status" className="rounded-3xl bg-white p-8 text-center shadow-soft">{state.message}</p>;
  }
  const field = "mt-1 w-full rounded-xl border border-beige bg-white px-4 py-3";
  const err = (k: string) => state.errors?.[k] && <p className="mt-1 text-sm text-[#b3263e]">{state.errors[k]}</p>;
  return (
    <form action={action} className="space-y-5 rounded-3xl bg-white p-6 shadow-soft md:p-8" noValidate>
      {state.message && <p role="alert" className="rounded-xl bg-[#fbecee] px-4 py-3 text-sm text-[#8a1c30]">{state.message}</p>}
      <div className="hidden" aria-hidden="true"><label>空欄のままにしてください<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="block"><span className="font-bold text-navy">お名前 <span className="text-xs text-rose-deep">必須</span></span><input name="name" autoComplete="name" className={field} required />{err("name")}</label>
      <label className="block"><span className="font-bold text-navy">メールアドレス <span className="text-xs text-rose-deep">必須</span></span><input name="email" type="email" autoComplete="email" className={field} required />{err("email")}</label>
      <label className="block"><span className="font-bold text-navy">件名</span><input name="subject" className={field} /></label>
      <label className="block"><span className="font-bold text-navy">お問い合わせ内容 <span className="text-xs text-rose-deep">必須</span></span><textarea name="body" rows={7} className={field} required />{err("body")}</label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="agree" className="mt-1 size-5 accent-rose-deep" /><span><Link href="/privacy" className="underline">プライバシーポリシー</Link>に同意します</span></label>
      {err("agree")}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-full bg-navy font-bold text-white disabled:opacity-60">{pending ? "送信しています…" : "送信する"}</button>
    </form>
  );
}
