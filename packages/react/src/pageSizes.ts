export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// One page never holds more rows than this, whatever a user saves
export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE_OPTIONS = 10;

// Whole numbers from 1 to MAX_PAGE_SIZE, no duplicates, smallest first.
// Anything else is dropped: storage is not always a validating backend.
export function cleanPageSizes(values: readonly unknown[]): number[] {
  const sizes = values
    .map((value) => (typeof value === "string" ? Number(value.trim()) : value))
    .filter(
      (value): value is number =>
        Number.isInteger(value) && Number(value) >= 1 && Number(value) <= MAX_PAGE_SIZE,
    );
  return [...new Set(sizes)].sort((a, b) => a - b).slice(0, MAX_PAGE_SIZE_OPTIONS);
}

// The user's sizes, or null when there are none that can be used
export function savedPageSizes(saved: readonly unknown[] | null | undefined) {
  const sizes = Array.isArray(saved) ? cleanPageSizes(saved) : [];
  return sizes.length > 0 ? sizes : null;
}
