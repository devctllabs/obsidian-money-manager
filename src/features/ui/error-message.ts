const MAX_ERROR_MESSAGE_LENGTH = 300;
const ABSOLUTE_PATH_PATTERN = /(^|[\s("'`])((?:\/|~\/|[A-Za-z]:[\\/]|\\\\)[^\s"'`<>]*)/g;

export function formatErrorMessage(error: unknown, fallback: string): string {
  let detail = error instanceof Error ? error.message.replace(/\s+/g, ' ').trim() : '';
  if (!detail) return fallback;

  if (/\b(EACCES|EPERM)\b/u.test(detail))
    detail = `${fallback} Check vault access and file permissions, then try again.`;
  else if (/\bENOSPC\b/u.test(detail))
    detail = `${fallback} Free up storage on this device, then try again.`;
  else if (/\bENOENT\b/u.test(detail))
    detail = [
      fallback,
      'A file or folder is missing. Refresh the workspace and check its folder in Settings.',
    ].join(' ');
  else if (/stale|changed since|conflict/iu.test(detail))
    detail = [
      fallback,
      'The Markdown changed since it was loaded. Refresh the workspace,',
      'review the latest values, and try again.',
    ].join(' ');

  const redacted = detail.replace(ABSOLUTE_PATH_PATTERN, '$1[path redacted]');
  return redacted.length <= MAX_ERROR_MESSAGE_LENGTH
    ? redacted
    : `${redacted.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1).trimEnd()}…`;
}
