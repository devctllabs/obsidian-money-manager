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
export interface Entry extends Fields {
  id: string;
  type: Flow | 'balance_checkpoint';
  date: string;
  account: string;
  amount?: string;
  balance?: string;
  category?: string;
  description?: string;
  reason?: string;
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
