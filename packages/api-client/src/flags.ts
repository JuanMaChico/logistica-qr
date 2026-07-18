const flags = {
  orders: {
    enabled: true,
  },
  products: {
    enabled: false,
  },
} as const;

function isEnabled(flag: string): boolean {
  const path = flag.split('.');
  let current: Record<string, unknown> = flags as unknown as Record<string, unknown>;

  for (const key of path) {
    const value = current[key];
    if (typeof value === 'object' && value !== null) {
      current = value as Record<string, unknown>;
    } else {
      return Boolean(value);
    }
  }

  return false;
}

export { flags, isEnabled };
