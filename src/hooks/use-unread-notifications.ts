"use client";

import { useCallback, useEffect, useState } from "react";
import { getUnreadCount } from "@/lib/services/notifications";

export function useUnreadNotifications(userId?: string) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCount(0);
      return;
    }
    try {
      setCount(await getUnreadCount(userId));
    } catch {
      setCount(0);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return { count, refresh };
}
