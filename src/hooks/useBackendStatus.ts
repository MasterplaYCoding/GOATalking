import { useEffect, useRef, useState } from "react";
import { syncOfflineQueue } from "../services/offlineQueueService";

const HEALTH_ENDPOINT = "http://localhost:3000/health";
const CHECK_INTERVAL_MS = 5000;

export function useBackendStatus() {
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const wasBackendOfflineRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkBackend = async () => {
      if (!navigator.onLine) {
        if (isMounted) {
          setIsBackendOffline(true);
        }
        return;
      }

      try {
        const response = await fetch(HEALTH_ENDPOINT, {
          method: "GET",
          cache: "no-store",
        });

        if (isMounted) {
          const nextIsOffline = !response.ok;

          setIsBackendOffline(nextIsOffline);

          if (!nextIsOffline && wasBackendOfflineRef.current) {
            void syncOfflineQueue();
          }

          wasBackendOfflineRef.current = nextIsOffline;
        }
      } catch {
        if (isMounted) {
          setIsBackendOffline(true);
          wasBackendOfflineRef.current = true;
        }
      }
    };

    const handleOnline = () => {
      void checkBackend();
    };

    const handleOffline = () => {
      setIsBackendOffline(true);
      wasBackendOfflineRef.current = true;
    };

    void checkBackend();
    const intervalId = window.setInterval(checkBackend, CHECK_INTERVAL_MS);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isBackendOffline;
}
