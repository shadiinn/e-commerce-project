export function generateOrderNumber(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const randomValues = crypto.getRandomValues(new Uint8Array(10));

  const suffix = Array.from(randomValues)
    .map(value => characters[value % characters.length])
    .join('');

  return `SA-${suffix}`;
}