// Makes ../CHANGELOG.md read well on the site:
// - GitHub alerts (`> [!IMPORTANT]` …) become <Callout>s instead of showing
//   the marker as text;
// - on the changelog page, `# 2.2.0` headings move down one level so the
//   versions sit under the page title and show up in its table of contents.
const calloutType = {
  NOTE: "info",
  TIP: "info",
  IMPORTANT: "warn",
  WARNING: "warn",
  CAUTION: "error",
};

function walk(node, fn) {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
}

function toCallout(blockquote) {
  const first = blockquote.children[0];
  const text = first?.type === "paragraph" ? first.children[0] : undefined;
  const match = text?.type === "text" && /^\[!(\w+)\]\s*/.exec(text.value);
  const type = match && calloutType[match[1].toUpperCase()];
  if (!type) return;

  text.value = text.value.slice(match[0].length);
  if (text.value === "") first.children.shift();
  if (first.children[0]?.type === "break") first.children.shift();
  if (first.children.length === 0) blockquote.children.shift();

  Object.assign(blockquote, {
    type: "mdxJsxFlowElement",
    name: "Callout",
    attributes: [{ type: "mdxJsxAttribute", name: "type", value: type }],
  });
}

export function remarkChangelog() {
  return (tree, file) => {
    const isChangelog = file.path?.endsWith("/content/docs/changelog.mdx");
    walk(tree, (node) => {
      if (node.type === "blockquote") toCallout(node);
      else if (isChangelog && node.type === "heading")
        node.depth = Math.min(node.depth + 1, 6);
    });
  };
}
