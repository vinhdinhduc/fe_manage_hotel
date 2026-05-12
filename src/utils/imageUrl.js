const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL, window.location.origin).origin;
  } catch {
    return "http://localhost:3000";
  }
};

export const resolveImageUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (
    /^(https?:)?\/\//i.test(raw) ||
    raw.startsWith("blob:") ||
    raw.startsWith("data:")
  ) {
    return raw.startsWith("//") ? `${window.location.protocol}${raw}` : raw;
  }

  const origin = getApiOrigin();
  return raw.startsWith("/") ? `${origin}${raw}` : `${origin}/${raw}`;
};
