
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  phonePublic: boolean;
  whatsappEnabled: boolean;
};

const initialProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  role: "",
  phonePublic: false,
  whatsappEnabled: false,
};

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", {
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }

          throw new Error(data.message || "Unable to load your profile.");
        }

        if (!cancelled) {
          setProfile({
            ...initialProfile,
            ...data.profile,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof Profile>(
    field: K,
    value: Profile[K]
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSuccess("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          phonePublic: profile.phonePublic,
          whatsappEnabled: profile.whatsappEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your profile.");
      }

      setProfile((current) => ({
        ...current,
        ...data.profile,
      }));

      setSuccess("Your profile and contact preferences have been saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
        <div className="flex items-center gap-3 text-sm text-[#526252]">
          <LoaderCircle className="animate-spin" size={20} />
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] px-4 py-8 text-[#243629] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#17472D] hover:underline"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="mt-6 rounded-3xl bg-[#17472D] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <UserRound size={25} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/65">
                Account settings
              </p>
              <h1 className="mt-1 text-2xl font-bold">Profile & contact</h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
            Manage your personal details and decide how other people on
            AgriVanta may contact you. Your phone number is private by default.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-[#e5e9e0] bg-white p-5 sm:p-7">
            <h2 className="text-base font-bold">Personal information</h2>
            <p className="mt-1 text-sm text-[#879084]">
              Your email and account type cannot be changed here.
            </p>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Full name
                </span>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={profile.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#dfe5da] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Email address
                </span>
                <input
                  readOnly
                  value={profile.email}
                  className="w-full rounded-xl border border-[#e8ebe4] bg-[#f7f8f4] px-4 py-3 text-sm text-[#778071]"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-semibold">
                  Account type
                </span>
                <p className="rounded-xl bg-[#f7f8f4] px-4 py-3 text-sm capitalize text-[#526252]">
                  {profile.role}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e5e9e0] bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <Phone size={21} className="text-[#17472D]" />
              <div>
                <h2 className="text-base font-bold">Contact phone number</h2>
                <p className="mt-1 text-sm text-[#879084]">
                  Optional. Include your country code when possible.
                </p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold">
                Phone number
              </span>
              <input
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={profile.phone}
                onChange={(event) => {
                  const phone = event.target.value;
                  setProfile((current) => ({
                    ...current,
                    phone,
                    phonePublic: phone.trim() ? current.phonePublic : false,
                    whatsappEnabled: phone.trim()
                      ? current.whatsappEnabled
                      : false,
                  }));
                  setSuccess("");
                  setError("");
                }}
                placeholder="+233 24 123 4567"
                className="w-full rounded-xl border border-[#dfe5da] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
            </label>

            <div className="mt-5 space-y-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={profile.phonePublic}
                  disabled={!profile.phone.trim()}
                  onChange={(event) =>
                    updateField("phonePublic", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-[#17472D]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Allow public phone contact
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#879084]">
                    Allow your phone number to be shown on your public seller
                    or service listings.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={profile.whatsappEnabled}
                  disabled={!profile.phone.trim() || !profile.phonePublic}
                  onChange={(event) =>
                    updateField("whatsappEnabled", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-[#17472D]"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle size={16} className="text-[#17472D]" />
                    Accept WhatsApp messages
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#879084]">
                    Allow visitors to contact you through WhatsApp when your
                    phone number is public.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-5 flex gap-3 rounded-xl bg-[#F8F6EE] p-4">
              <LockKeyhole size={19} className="mt-0.5 shrink-0 text-[#806020]" />
              <p className="text-xs leading-5 text-[#6f6958]">
                Your number stays private unless you explicitly enable public
                phone contact. Removing your number automatically disables
                public phone and WhatsApp contact.
              </p>
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-[#EAF0E6] p-4 text-sm text-[#17472D]">
              <CheckCircle2 size={18} className="shrink-0" />
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17472D] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving changes..." : "Save profile"}
          </button>
        </form>
      </div>
    </main>
  );
}
