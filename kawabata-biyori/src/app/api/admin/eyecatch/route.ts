import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AdminError, requireAdmin } from "@/lib/admin/auth";

/** AI画像スタジオから記事のアイキャッチを設定する */
export async function POST(req: Request) {
  try {
    const { supabase } = await requireAdmin();
    const { id, mediaId } = z.object({ id: z.string().uuid(), mediaId: z.string().uuid() }).parse(await req.json());
    const { data: m } = await supabase.from("media").select("url, alt, source").eq("id", mediaId).single();
    if (!m) throw new AdminError("画像が見つかりません。", 404);
    const { error } = await supabase.from("articles").update({ thumbnail: m.url, thumbnail_alt: m.alt, thumbnail_is_ai: m.source === "ai" }).eq("id", id);
    if (error) throw new AdminError(error.message, 500);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = e instanceof AdminError ? e.status : 400;
    return NextResponse.json({ error: e instanceof Error ? e.message : "設定できませんでした。" }, { status });
  }
}
