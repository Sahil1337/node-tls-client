import {
  createFileSystemGeneratorCache,
  createGenerator,
} from "fumadocs-typescript";

// Reads the library's TypeScript sources (../src/types) at build time;
// `path` resolves from website/, the build's working directory.
const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

/** JSDoc descriptions are markdown; render their `code` spans, keep the rest as text. */
function Inline({ text }: { text: string }) {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
    );
}

/**
 * A flat table of an interface's fields (name, type, JSDoc), generated from
 * the source so it can't drift. Unlike Fumadocs' type table, nothing is
 * collapsed behind a click.
 */
export async function PropTable({
  path,
  name,
}: {
  path: string;
  name: string;
}) {
  const [doc] = await generator.generateTypeTable({ path, name });
  if (!doc) throw new Error(`PropTable: ${name} not found in ${path}`);
  return (
    <div className="relative my-6 overflow-auto prose-no-margin" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {doc.entries.map((entry) => (
            <tr key={entry.name}>
              <td>
                <code>
                  {entry.name}
                  {entry.required ? "" : "?"}
                </code>
              </td>
              <td>
                {/* "?" after the name already says it's optional; Buffer's
                    generic parameter is noise for readers */}
                <code>
                  {entry.type
                    .replace(/ \| undefined$/, "")
                    .replace(/<ArrayBufferLike>/g, "")}
                </code>
              </td>
              <td>
                {entry.deprecated && <strong>Deprecated. </strong>}
                <Inline text={entry.description} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
