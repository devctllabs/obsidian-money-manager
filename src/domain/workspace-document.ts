import { parseDocument, stringify } from 'yaml';

export type Fields = Record<string, unknown>;
export function mapping(value: unknown): Fields {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a mapping');
  return value as Fields;
}
export function normalizeRoot(input: string): string {
  const root = input.trim().replace(/\/+$/u, '');
  if (
    !root ||
    root.startsWith('/') ||
    /[\\:]/u.test(root) ||
    [...root].some((char) => char.charCodeAt(0) < 32)
  )
    throw new Error('Invalid workspace root');
  if (root.split('/').some((part) => !part || part.startsWith('.')))
    throw new Error('Invalid workspace root');
  return root;
}
export function decodeDocument(text: string) {
  const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/u.exec(text);
  if (!match) throw new Error('Missing YAML frontmatter');
  const yaml = parseDocument(match[1]!, { uniqueKeys: true });
  if (yaml.errors.length) throw new Error(yaml.errors[0]!.message);
  const frontmatter = mapping(yaml.toJS() as unknown);
  const managed = mapping(frontmatter.money_manager);
  if (managed.schema_version !== 1) throw new Error('Unsupported or missing schema_version');
  return { managed, frontmatter, body: text.slice(match[0].length) };
}
export function encodeDocument(document: ReturnType<typeof decodeDocument>): string {
  const frontmatter = stringify({ ...document.frontmatter, money_manager: document.managed });
  return `---\n${frontmatter}---${document.body}`;
}
export function newDocument(managed: Fields): string {
  return `---\n${stringify({ money_manager: { schema_version: 1, ...managed } })}---\n`;
}
