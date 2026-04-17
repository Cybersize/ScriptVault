import { useState, useEffect, useCallback } from "react";

const SECRET_KEY = "admin_secret";

export function useAdminSecret() {
  const [secret, setSecretState] = useState<string | null>(() => {
    return sessionStorage.getItem(SECRET_KEY);
  });

  const setSecret = useCallback((newSecret: string | null) => {
    if (newSecret) {
      sessionStorage.setItem(SECRET_KEY, newSecret);
    } else {
      sessionStorage.removeItem(SECRET_KEY);
    }
    setSecretState(newSecret);
  }, []);

  const getHeaders = useCallback(() => {
    return secret ? { "X-Admin-Secret": secret } : {};
  }, [secret]);

  return { secret, setSecret, getHeaders };
}
