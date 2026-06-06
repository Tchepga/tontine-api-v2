function normalizePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');
}

export function buildUsername(firstname: string, lastname: string): string {
  return `${normalizePart(firstname)}.${normalizePart(lastname)}`;
}

export async function generateUniqueUsername(
  firstname: string,
  lastname: string,
  existsFn: (username: string) => Promise<boolean>,
): Promise<string> {
  const base = buildUsername(firstname, lastname);
  let candidate = base;
  let suffix = 2;

  while (await existsFn(candidate)) {
    candidate = `${base}${suffix}`;
    suffix++;
  }

  return candidate;
}
