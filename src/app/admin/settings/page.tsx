"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Loader2,
  Megaphone,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Store,
  UserPlus,
  Wrench,
} from "lucide-react";

type SettingsData = {
  registrationEnabled: boolean;
  marketplaceEnabled: boolean;
  maintenanceMode: boolean;
  announcement: {
    enabled: boolean;
    title: string;
    message: string;
  };
  updatedAt: string | null;
};

const defaultSettings: SettingsData = {
  registrationEnabled: true,
  marketplaceEnabled: true,
  maintenanceMode: false,
  announcement: {
    enabled: false,
    title: "",
    message: "",
  },
  updatedAt: null,
};

function SettingToggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        enabled ? "bg-[#17472D]" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function PlatformSettingsPage() {
  const [settings, setSettings] =
    useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load platform settings."
        );
      }

      setSettings(data.settings);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSuccess("");
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save platform settings."
        );
      }

      setSettings(data.settings);
      setSuccess("Your platform settings have been saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#17472D]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#17472D]"
        >
          <ArrowLeft size={17} />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#17472D]">
              <Settings size={21} />
              <span className="text-sm font-semibold">
                Administration
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#17472D]">
              Platform Settings
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage registration, marketplace availability and
              platform announcements.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#17472D]">
                  <UserPlus size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    User Registration
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Control whether new users can create AgriVanta
                    accounts.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#17472D]">
                    {settings.registrationEnabled
                      ? "New registrations are allowed"
                      : "New registrations are paused"}
                  </p>
                </div>
              </div>

              <SettingToggle
                enabled={settings.registrationEnabled}
                onChange={(value) =>
                  updateSetting("registrationEnabled", value)
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#A87920]">
                  <Store size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Marketplace Availability
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Control access to marketplace listings and
                    the creation of new listings.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#17472D]">
                    {settings.marketplaceEnabled
                      ? "Marketplace is enabled"
                      : "Marketplace is disabled"}
                  </p>
                </div>
              </div>

              <SettingToggle
                enabled={settings.marketplaceEnabled}
                onChange={(value) =>
                  updateSetting("marketplaceEnabled", value)
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Megaphone size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Platform Announcement
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Publish an important message to users across
                    the platform.
                  </p>
                </div>
              </div>

              <SettingToggle
                enabled={settings.announcement.enabled}
                onChange={(value) =>
                  updateSetting("announcement", {
                    ...settings.announcement,
                    enabled: value,
                  })
                }
              />
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
              <div>
                <label
                  htmlFor="announcement-title"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Announcement Title
                </label>
                <input
                  id="announcement-title"
                  type="text"
                  maxLength={100}
                  value={settings.announcement.title}
                  onChange={(event) =>
                    updateSetting("announcement", {
                      ...settings.announcement,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter announcement title"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-message"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Announcement Message
                </label>
                <textarea
                  id="announcement-message"
                  rows={4}
                  maxLength={1000}
                  value={settings.announcement.message}
                  onChange={(event) =>
                    updateSetting("announcement", {
                      ...settings.announcement,
                      message: event.target.value,
                    })
                  }
                  placeholder="Write the message users should see..."
                  className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {settings.announcement.message.length}/1000
                  characters
                </p>
              </div>

              {settings.announcement.enabled && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  The announcement is enabled. It will appear
                  publicly after we connect the announcement
                  display to the platform layout.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Wrench size={21} />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Maintenance Mode
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  A coordinated maintenance system is planned.
                  It will need to protect public pages and APIs
                  while preserving administrator access.
                </p>
                <span className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Planned feature
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#17472D]"
              />
              <div>
                <h3 className="text-sm font-semibold text-[#17472D]">
                  Administrator control
                </h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Changes are saved to the platform configuration
                  and protected by administrator authentication.
                  Registration and marketplace controls will take
                  effect once their application endpoints are
                  connected.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center">
            <p className="text-xs text-gray-500">
              {settings.updatedAt
                ? `Last updated: ${new Date(
                    settings.updatedAt
                  ).toLocaleString()}`
                : "No settings have been saved yet."}
            </p>

            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#103821] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}