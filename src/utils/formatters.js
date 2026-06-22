export function money(value) {
  const safe = Number(value) || 0;

  return safe.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
