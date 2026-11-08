"use client";

import { useRouter } from "next/navigation";
import { deleteContactMessage } from "@/app/admin/_actions/settings";

export function DeleteContactButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-xs text-[#b3263e] underline"
      onClick={async () => {
        if (!window.confirm("このお問い合わせを削除しますか？")) return;
        const r = await deleteContactMessage(id);
        if (r.ok) router.refresh();
        else window.alert(r.error);
      }}
    >
      削除
    </button>
  );
}
