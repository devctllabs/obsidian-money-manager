import type { Fields } from './workspace-document';
export interface Account extends Fields {
  name: string;
  currency: string;
}
export interface Category extends Fields {
  name: string;
  color?: string;
}
export type Flow = 'expense' | 'income';
export interface EntryData extends Fields {
  type: Flow | 'balance_checkpoint';
  date: string;
  account: string;
  amount?: string;
  balance?: string;
  category?: string;
  description?: string;
  reason?: string;
}
export interface Entry extends EntryData {
  id: string;
}
export interface LocatedEntry {
  entry: Entry;
  path: string;
  position: number;
}
export interface Diagnostic {
  path: string;
  record?: string;
  field: string;
  message: string;
  monetary: boolean;
}

export function entryMinute(date: string): string {
  return date.length === 10 ? `${date}T00:00` : date;
}

export function compareEntries(left: Entry, right: Entry): number {
  const byMinute = entryMinute(left.date).localeCompare(entryMinute(right.date));
  return byMinute || left.id.toLowerCase().localeCompare(right.id.toLowerCase());
}
