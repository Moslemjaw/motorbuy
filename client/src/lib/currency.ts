export function formatKWD(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `KD ${num.toFixed(3)}`;
}
