export function normalizeSearchValue(value: unknown): string {
  return String(value ?? "").toLowerCase().trim();
}

export function matchesSearch<T>(item: T, query: string, selectors: Array<(item: T) => unknown>): boolean {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;
  return selectors.some((selector) => normalizeSearchValue(selector(item)).includes(normalizedQuery));
}

export function filterByValue<T>(items: readonly T[], value: string, selector: (item: T) => unknown): T[] {
  if (!value || value === "All") return [...items];
  return items.filter((item) => String(selector(item)) === value);
}
