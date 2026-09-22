// Only the public file types consumed by VaultDocuments; host lifecycle is E2E-owned.
export class TFile {
  path = '';
  extension = 'md';
}
export class TFolder {
  path = '';
  children: Array<TFile | TFolder> = [];
}
export function normalizePath(path: string) {
  return path.replace(/\/{2,}/gu, '/').replace(/\/$/u, '');
}
