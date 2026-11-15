"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT = 30 * 60 * 1000;
const REFRESH_INTERVAL = 5 * 60 * 1000;
const ACTIVITY_KEY = "agrivanta_last_activity";
const CHANNEL_NAME = "agrivanta_session_activity";

export default function SessionTimeout() {
  const router = useRouter();

  useEffect(() => {

    let authenticated = false;
    let expired = false;
    let lastActivity = Date.now();
    let refreshInProgress = false;
    let refreshController: AbortController | null = null;

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;

    function saveActivity(timestamp: number) {
      lastActivity = timestamp;

      try {
        localStorage.setItem(ACTIVITY_KEY, String(timestamp));
      } catch {
        // The in-memory timer remains available if storage is blocked.
      }

      channel?.postMessage({ type: "activity", timestamp });
    }

    function handleActivity() {
      if (!authenticated || expired) return;

      const now = Date.now();

      // Avoid excessive storage writes and cross-tab messages.
      if (now - lastActivity >= 5000) {
        saveActivity(now);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== ACTIVITY_KEY || !event.newValue) return;

      const timestamp = Number(event.newValue);

      if (Number.isFinite(timestamp) && timestamp > lastActivity) {
        lastActivity = timestamp;
      }
    }

    function handleBroadcast(event: MessageEvent) {
      if (event.data?.type === "logout") {
        if (expired) return;

        expired = true;
        refreshController?.abort();
        refreshController = null;

        router.replace("/login");
        router.refresh();
        return;
      }

      if (
        event.data?.type === "activity" &&
        typeof event.data.timestamp === "number" &&
        event.data.timestamp > lastActivity
      ) {
        lastActivity = event.data.timestamp;
      }
    }

    async function logoutForInactivity() {
      if (expired) return;

      expired = true;
      refreshController?.abort();
      refreshController = null;

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch (error) {
        console.error("Automatic logout failed:", error);
      } finally {
        router.replace("/login?reason=session-expired");
        router.refresh();
      }
    }

    async function refreshSession() {
      if (!authenticated || expired || refreshInProgress) return;

      if (Date.now() - lastActivity >= INACTIVITY_LIMIT) {
        await logoutForInactivity();
        return;
      }

      refreshInProgress = true;
      const controller = new AbortController();
      refreshController = controller;

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          await logoutForInactivity();
        } else if (!response.ok) {
          console.error("Unable to refresh session:", response.status);
        }
      } catch (error) {
        console.error("Session refresh request failed:", error);
      } finally {
        refreshInProgress = false;
        refreshController = null;
      }
    }

    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ] as const;

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    window.addEventListener("storage", handleStorage);
    channel?.addEventListener("message", handleBroadcast);

    async function initialize() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        authenticated = true;

        let storedActivity: number | null = null;

        try {
          const storedValue = localStorage.getItem(ACTIVITY_KEY);

          if (storedValue) {
            const parsedValue = Number(storedValue);

            if (
              Number.isFinite(parsedValue) &&
              parsedValue > 0 &&
              parsedValue <= Date.now()
            ) {
              storedActivity = parsedValue;
            }
          }
        } catch {
          console.warn("Unable to read stored session activity.");
        }

        if (storedActivity === null) {
          saveActivity(Date.now());
          return;
        }

        lastActivity = storedActivity;

        if (Date.now() - lastActivity >= INACTIVITY_LIMIT) {
          await logoutForInactivity();
        }
      } catch (error) {
        console.error("Unable to initialize session monitor:", error);
      }
    }

    void initialize();

    const inactivityTimer = window.setInterval(() => {
      if (
        authenticated &&
        !expired &&
        Date.now() - lastActivity >= INACTIVITY_LIMIT
      ) {
        void logoutForInactivity();
      }
    }, 1000);

    const refreshTimer = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL);

    return () => {
      window.clearInterval(inactivityTimer);
      window.clearInterval(refreshTimer);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      window.removeEventListener("storage", handleStorage);
      channel?.removeEventListener("message", handleBroadcast);
      channel?.close();
    };
  }, [router]);

  return null;
}


