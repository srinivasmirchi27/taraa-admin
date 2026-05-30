const KEY = "taraa_custom_categories";

export function getCustomCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addCustomCategory(name: string): void {
  const existing = getCustomCategories();
  const normalized = name.trim().toLowerCase();
  if (!normalized || existing.includes(normalized)) return;
  localStorage.setItem(KEY, JSON.stringify([...existing, normalized]));
}

export function removeCustomCategory(name: string): void {
  const existing = getCustomCategories();
  localStorage.setItem(KEY, JSON.stringify(existing.filter((c) => c !== name)));
}
