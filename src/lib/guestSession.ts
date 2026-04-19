const GUEST_TOKEN_STORAGE_KEY = "hempit.guest.token";

const isBrowser = () => typeof window !== "undefined";

export const getGuestToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const token = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  return token && token.trim().length ? token : null;
};

export const setGuestToken = (token: string): void => {
  if (!isBrowser()) {
    return;
  }

  const normalized = token.trim();
  if (!normalized.length) {
    return;
  }

  window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, normalized);
};

export const clearGuestToken = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
};
