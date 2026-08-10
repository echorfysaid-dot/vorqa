const compareKey = "vorqa-marketplace-compare";
const shortlistKey = "vorqa-marketplace-shortlist";

function readSelection(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSelection(key: string, slugs: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(slugs))));
}

export const marketplaceSelection = {
  getCompare: () => readSelection(compareKey),
  setCompare: (slugs: string[]) => writeSelection(compareKey, slugs.slice(0, 4)),
  getShortlist: () => readSelection(shortlistKey),
  setShortlist: (slugs: string[]) => writeSelection(shortlistKey, slugs)
};
