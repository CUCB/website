export const rotateBy =
  (dayOffset: number) =>
  <T>(array: T[]): T[] =>
    [...array.slice(dayOffset - 1), ...array.slice(0, dayOffset - 1)];
