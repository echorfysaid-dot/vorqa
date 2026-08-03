export function sortByText<T>(items: readonly T[], selector: (item: T) => string, direction: "asc" | "desc" = "asc"): T[] {
  return [...items].sort((a, b) => {
    const result = selector(a).localeCompare(selector(b));
    return direction === "asc" ? result : -result;
  });
}

export function sortByNumber<T>(items: readonly T[], selector: (item: T) => number, direction: "asc" | "desc" = "desc"): T[] {
  return [...items].sort((a, b) => {
    const result = selector(a) - selector(b);
    return direction === "asc" ? result : -result;
  });
}
