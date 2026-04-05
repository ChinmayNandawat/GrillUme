import { useEffect, useMemo, useState } from "react";
import { checkBackendHealth } from "../services/api";

type SplashHealthState = {
  isServerReady: boolean;
  hasTimedOut: boolean;
  isComplete: boolean;
};

type SplashHealthOptions = {
  endpoint: string;
  maxWaitMs: number;
  pingIntervalMs: number;
  requestTimeoutMs: number;
};

const DEFAULT_OPTIONS: SplashHealthOptions = {
  endpoint: "/api/health",
  maxWaitMs: 15000,
  pingIntervalMs: 1400,
  requestTimeoutMs: 2500,
};

export const useSplashHealth = (options?: Partial<SplashHealthOptions>): SplashHealthState => {
  const config = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...(options || {}),
    }),
    [options]
  );

  const [isServerReady, setIsServerReady] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let pollTimer: number | undefined;
    const startedAt = Date.now();

    const pingServer = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= config.maxWaitMs) {
        if (!isCancelled) {
          setHasTimedOut(true);
        }
        return;
      }

      const isHealthy = await checkBackendHealth(config.endpoint, config.requestTimeoutMs);

      if (isCancelled) return;

      if (isHealthy) {
        setIsServerReady(true);
        return;
      }

      pollTimer = window.setTimeout(pingServer, config.pingIntervalMs);
    };

    void pingServer();

    return () => {
      isCancelled = true;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [config.endpoint, config.maxWaitMs, config.pingIntervalMs, config.requestTimeoutMs]);

  return {
    isServerReady,
    hasTimedOut,
    isComplete: isServerReady || hasTimedOut,
  };
};
