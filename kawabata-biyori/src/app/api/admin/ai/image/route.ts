import { z } from "zod/v4";
import { aiRoute } from "@/lib/ai/route";
import { AdminError } from "@/lib/admin/auth";
import { editImage, generateImage } from "@/lib/ai/image";

export const maxDuration = 300;

const req = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate"),
    prompt: z.string().trim().min(3).max(2000),
    style: z.enum(["photo", "kawaii", "watercolor", "magazine", "auto"]),
    aspect: z.enum(["16:9", "1:1", "9:16"]),
    alt: z.string().max(200).default(""),
  }),
  z.object({
    action: z.literal("edit"),
    mediaId: z.string().uuid(),
    instruction: z.string().trim().min(2).max(1000),
    aspect: z.enum(["16:9", "1:1", "9:16"]),
  }),
]);

export const POST = aiRoute("image", (s) => s.image_model, async ({ settings, admin }, body) => {
  const input = req.parse(body);
  const { supabase, user } = admin;

  let img: Awaited<ReturnType<typeof generateImage>>;
  let parent: { id: string; alt: string; prompt: string | null; style: string | null } | null = null;
  if (input.action === "generate") {
    img = await generateImage({ model: settings.image_model, prompt: input.prompt, style: input.style, aspect: input.aspect });
  } else {
    const { data } = await supabase.from("media").select("id, url, alt, prompt, style").eq("id", input.mediaId).single();
    if (!data) throw new AdminError("元の画像が見つかりません。", 404);
    const src = await fetch(data.url);
    if (!src.ok) throw new AdminError("元の画像を読み込めませんでした。", 502);
    parent = data;
    img = await editImage({ model: settings.image_model, source: Buffer.from(await src.arrayBuffer()), instruction: input.instruction, aspect: input.aspect });
  }

  // 元画像は残し、新しいバージョンとして保存する
  const path = `ai/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.webp`;
  const { error: upErr } = await supabase.storage.from("media").upload(path, img.buffer, { contentType: img.mime, upsert: false });
  if (upErr) throw new AdminError(`画像の保存に失敗しました: ${upErr.message}`, 500);
  const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  const { data: media, error } = await supabase
    .from("media")
    .insert({
      path,
      url,
      mime: img.mime,
      width: img.width,
      height: img.height,
      bytes: img.buffer.length,
      source: "ai",
      alt: input.action === "generate" ? input.alt : parent?.alt ?? "",
      prompt: input.action === "generate" ? input.prompt : `${parent?.prompt ?? ""}\n[編集] ${input.instruction}`.trim(),
      style: input.action === "generate" ? input.style : parent?.style,
      parent_id: parent?.id ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) throw new AdminError(`画像情報の保存に失敗しました: ${error.message}`, 500);
  return { result: media };
});
