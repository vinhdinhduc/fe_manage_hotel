export const toArray = (value) => (Array.isArray(value) ? value : []);

export const pickArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    const candidate = value?.[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export const pickObject = (value, key, fallback = {}) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (!key) return value;
    const candidate = value[key];
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      return candidate;
    }
  }
  return fallback;
};
