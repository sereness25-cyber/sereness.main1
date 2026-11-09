import { Node, mergeAttributes } from "@tiptap/react";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    callout: { toggleCallout: () => ReturnType };
    embedCard: { insertEmbedCard: (kind: "shop" | "article", slug: string, label: string) => ReturnType };
  }
}

/** 注意書きボックス <div class="callout" data-callout> */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML: () => [{ tag: "div[data-callout]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-callout": "", class: "callout" }), 0],
  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

function cardNode(kind: "shop" | "article", label: string) {
  return Node.create({
    name: `${kind}Card`,
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes: () => ({
      slug: { default: "", parseHTML: (el) => el.getAttribute("data-slug") ?? "" },
      label: { default: "", parseHTML: (el) => el.textContent?.replace(/^.*?：/, "") ?? "" },
    }),
    parseHTML: () => [{ tag: `div[data-${kind}-card]` }],
    renderHTML: ({ node }) => ["div", { [`data-${kind}-card`]: "", "data-slug": node.attrs.slug }, `${label}：${node.attrs.label || node.attrs.slug}`],
  });
}

/** 店舗紹介カード・関連記事カード。公開ページでは実データのカードに置き換わる */
export const ShopCard = cardNode("shop", "店舗紹介カード");
export const ArticleCardNode = cardNode("article", "関連記事カード");

export const EmbedCardCommands = Node.create({
  name: "embedCardCommands",
  addCommands() {
    return {
      insertEmbedCard:
        (kind, slug, label) =>
        ({ commands }) =>
          commands.insertContent({ type: `${kind}Card`, attrs: { slug, label } }),
    };
  },
});
