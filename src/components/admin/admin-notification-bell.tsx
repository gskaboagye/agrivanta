"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, LoaderCircle, X } from "lucide-react";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  reportId: string;
  referenceNumber: string;
  read: boolean;
  createdAt: string | Date | null;
};

export default function AdminNotificationBell() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status !== 401 && response.status !== 403) {
          console.error("Unable to fetch admin notifications.");
        }
        return;
      }

      const data = await response.json();

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : []
      );
      setUnreadCount(
        typeof data.unreadCount === "number" ? data.unreadCount : 0
      );
    } catch (error) {
      console.error("Admin notification loading error:", error);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  async function markAsRead(notification: AdminNotification) {
    if (updating) return;

    setUpdating(notification.id);

    try {
      if (!notification.read) {
        const response = await fetch("/api/admin/notifications", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationId: notification.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Unable to mark notification as read.");
        }

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item
          )
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setIsOpen(false);

      if (notification.reportId) {
        router.push(
          `/admin/user-reports/${encodeURIComponent(notification.reportId)}`
        );
      } else {
        router.push("/admin/user-reports");
      }
    } catch (error) {
      console.error("Admin notification update error:", error);
      await loadNotifications();
    } finally {
      setUpdating(null);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || updating) return;

    setUpdating("all");

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notifications as read.");
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all admin notifications error:", error);
      await loadNotifications();
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(value: string | Date | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open);
          void loadNotifications();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e9e1] text-[#526451] transition hover:bg-[#f5f7f2]"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <section className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#e5e9e1] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#edf0e9] px-4 py-4">
              <div>
                <h2 className="text-sm font-bold text-[#17472D]">
                  Notifications
                </h2>
                <p className="mt-0.5 text-xs text-[#899487]">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    disabled={updating !== null}
                    className="flex items-center gap-1 text-xs font-semibold text-[#17472D] hover:underline disabled:opacity-50"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-[#899487] hover:bg-[#f5f7f2]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Bell className="mx-auto mb-3 text-[#a0aa9d]" size={25} />
                  <p className="text-sm font-semibold text-[#526451]">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-xs text-[#899487]">
                    New report activity will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => void markAsRead(notification)}
                    disabled={updating !== null}
                    className={`flex w-full items-start gap-3 border-b border-[#f0f2ed] px-4 py-4 text-left transition hover:bg-[#f7f9f5] disabled:opacity-60 ${
                      notification.read ? "bg-white" : "bg-[#f4f8f1]"
                    }`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                      {updating === notification.id ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : notification.read ? (
                        <Check size={17} />
                      ) : (
                        <Bell size={17} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#354737]">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D9A441]" />
                        )}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#6f7c6c]">
                        {notification.message}
                      </span>

                      {notification.referenceNumber && (
                        <span className="mt-1 block text-[11px] font-semibold text-[#17472D]">
                          {notification.referenceNumber}
                        </span>
                      )}

                      <span className="mt-2 block text-[10px] text-[#9aa294]">
                        {formatDate(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-[#edf0e9] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/admin/user-reports");
                }}
                className="w-full text-center text-xs font-bold text-[#17472D] hover:underline"
              >
                View user reports
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
