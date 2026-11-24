import Link from "next/link";
import { KAWABATA_API } from "@/lib/constants";

/** GitHub Pages 用のお問い合わせフォーム。送信は public/js/kawabata-site.js が Apps Script に送る */
export function StaticContactForm() {
  const field = "mt-1 w-full rounded-xl border border-beige bg-white px-4 py-3";
  const err = (k: string) => <p className="mt-1 text-sm text-[#b3263e]" data-kb-err={k} hidden />;
  return (
    <div>
      <p role="status" className="border border-navy/15 bg-white p-8 text-center" data-kb-done hidden>
        お問い合わせを受け付けました。内容を確認のうえ、ご連絡します。
      </p>
      <form className="space-y-5 border border-navy/15 bg-white p-6 md:p-8" noValidate data-kb-contact data-api={KAWABATA_API}>
        <p role="alert" className="rounded-xl bg-[#fbecee] px-4 py-3 text-sm text-[#8a1c30]" data-kb-msg hidden />
        <div className="hidden" aria-hidden="true"><label>空欄のままにしてください<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="block"><span className="font-bold text-navy">お名前 <span className="text-xs text-rose-deep">必須</span></span><input name="name" autoComplete="name" maxLength={50} className={field} required />{err("name")}</label>
        <label className="block"><span className="font-bold text-navy">メールアドレス <span className="text-xs text-rose-deep">必須</span></span><input name="email" type="email" autoComplete="email" maxLength={120} className={field} required />{err("email")}</label>
        <label className="block"><span className="font-bold text-navy">件名</span><input name="subject" maxLength={80} className={field} /></label>
        <label className="block"><span className="font-bold text-navy">お問い合わせ内容 <span className="text-xs text-rose-deep">必須</span></span><textarea name="body" rows={7} maxLength={2000} className={field} required />{err("body")}</label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="agree" className="mt-1 size-5 accent-rose-deep" /><span><Link href="/privacy" className="underline">プライバシーポリシー</Link>に同意します</span></label>
        {err("agree")}
        <button type="submit" className="h-12 w-full bg-navy font-bold text-white disabled:opacity-60">送信する</button>
      </form>
    </div>
  );
}
