export function formatKWD(price: number | string | undefined | null): string {
  if (price === undefined || price === null || price === '') return "KD 0.000";
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return "KD 0.000";
  return `KD ${num.toFixed(3)}`;
}
