/**
 * Fixed daily targets for the input tracker (not edited in the log form).
 * Change these when your plan changes.
 */
export const INPUT_TARGETS = {
  CALORIES: 1700,
  PROTEIN_G: 110,
  SLEEP_HOURS: 8,
  /** Litres — display uses this for labels */
  WATER_LITERS: 4,
  /** Daily step goal */
  STEPS: 10_000,
  /** Dietary fibre (g) */
  FIBER_G: 25,
  /** Fruit intake (g) */
  FRUITS_G: 500,
} as const;

export function waterTargetLabel(): string {
  return `${INPUT_TARGETS.WATER_LITERS} L`;
}

/**
 * Same output on server and browser (avoids hydration mismatch from
 * `toLocaleString()` using different default locales).
 */
export function formatTargetInt(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    n
  );
}
