import type { OptionItem } from '@/schemas/types';

export function optionItemsEqual(a: OptionItem, b: OptionItem): boolean {
  return String(a.value) === String(b.value);
}

/** Preserves first occurrence order when deduping by option `value`. */
export function uniqueOptionItems(items: OptionItem[]): OptionItem[] {
  const seen = new Set<string>();
  const out: OptionItem[] = [];
  for (const item of items) {
    const key = String(item.value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function uniqueNumericIdsFromOptions(items: OptionItem[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const item of items) {
    const id = Number(item.value);
    if (Number.isNaN(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
