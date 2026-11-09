export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  // </script> の混入を防ぐため < をエスケープする
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
