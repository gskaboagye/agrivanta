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
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { optionalPhoneSchema } from "@/lib/validation";

type Profile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  phonePublic: boolean;
  whatsappEnabled: boolean;
  emailPublic: boolean;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  smsNotificationsEnabled: boolean;
  smsConsentAt: string | null;
};

const initialProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  role: "",
  phonePublic: true,
  whatsappEnabled: true,
  emailPublic: false,
  phoneVerified: false,
  phoneVerifiedAt: null,
  smsNotificationsEnabled: false,
  smsConsentAt: null,
};

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [savedPhone, setSavedPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const normalizedPhone = optionalPhoneSchema.safeParse(profile.phone);
  const currentPhone = normalizedPhone.success
    ? normalizedPhone.data
    : "";
  const phoneMatchesSaved = Boolean(
    currentPhone && currentPhone === savedPhone
  );
  const phoneVerified =
    profile.phoneVerified && phoneMatchesSaved;

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
          const loadedProfile = {
            ...initialProfile,
            ...data.profile,
          };

          setProfile(loadedProfile);
          setSavedPhone(loadedProfile.phone);
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
    setError("");
    setSuccess("");

    const phoneResult = optionalPhoneSchema.safeParse(profile.phone);

    setPhoneError(
      phoneResult.success
        ? ""
        : phoneResult.error.issues[0]?.message ??
            "Enter a valid phone number."
    );

    if (!phoneResult.success) return;

    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: phoneResult.data,
          phonePublic: profile.phonePublic,
          whatsappEnabled: profile.whatsappEnabled,
          emailPublic: profile.emailPublic,
          smsNotificationsEnabled: profile.smsNotificationsEnabled,
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

      setSavedPhone(data.profile.phone);
      setCodeSent(false);
      setVerificationCode("");

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

  async function handleRequestCode() {
    setError("");
    setSuccess("");

    if (!phoneMatchesSaved) {
      setError("Save your current phone number before requesting verification.");
      return;
    }

    setRequestingCode(true);

    try {
      const response = await fetch(
        "/api/profile/phone-verification/request",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send verification code.");
      }

      setCodeSent(true);
      setVerificationCode("");
      setSuccess(data.message || "A verification code has been sent.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send verification code."
      );
    } finally {
      setRequestingCode(false);
    }
  }

  async function handleVerifyCode() {
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    setVerifyingCode(true);

    try {
      const response = await fetch(
        "/api/profile/phone-verification/verify",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: verificationCode }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to verify your phone.");
      }

      setProfile((current) => ({
        ...current,
        phoneVerified: true,
        phoneVerifiedAt: data.phoneVerifiedAt ?? new Date().toISOString(),
      }));

      setCodeSent(false);
      setVerificationCode("");
      setSuccess("Your phone number has been verified successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify your phone number."
      );
    } finally {
      setVerifyingCode(false);
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
            AgriVanta may contact you. Public phone and WhatsApp contact
            preferences are independent of SMS notification consent.
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
                  Add a valid phone number to use phone-based features.
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
                    phonePublic: phone.trim()
                      ? current.phone.trim()
                        ? current.phonePublic
                        : true
                      : false,
                    whatsappEnabled: phone.trim()
                      ? current.phone.trim()
                        ? current.whatsappEnabled
                        : true
                      : false,
                    phoneVerified: current.phone === phone
                      ? current.phoneVerified
                      : false,
                    smsNotificationsEnabled: current.phone === phone
                      ? current.smsNotificationsEnabled
                      : false,
                  }));
                  setCodeSent(false);
                  setVerificationCode("");
                  setPhoneError("");
                  setSuccess("");
                  setError("");
                }}
                onBlur={() => {
                  const result = optionalPhoneSchema.safeParse(profile.phone);
                  setPhoneError(
                    result.success
                      ? ""
                      : result.error.issues[0]?.message ??
                          "Enter a valid phone number."
                  );
                }}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? "phone-error" : undefined}
                placeholder="+233 24 123 4567"
                className="w-full rounded-xl border border-[#dfe5da] px-4 py-3 text-sm outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
              />
              {phoneError && (
                <span id="phone-error" className="mt-1 block text-xs text-red-600">
                  {phoneError}
                </span>
              )}
            </label>

            {profile.phone.trim() && (
              <div className="mt-4 rounded-xl border border-[#e5e9e0] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={19}
                      className={phoneVerified ? "text-green-700" : "text-[#879084]"}
                    />
                    <span className="text-sm font-semibold">
                      Phone verification
                    </span>
                  </div>

                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle2 size={14} />
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      Not verified
                    </span>
                  )}
                </div>

                {phoneVerified ? (
                  <p className="mt-2 text-xs leading-5 text-[#879084]">
                    Your current phone number has been verified.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-xs leading-5 text-[#879084]">
                      Verify your number to enable SMS notifications. Save any
                      phone number changes before requesting a code.
                    </p>

                    {!phoneMatchesSaved && (
                      <p className="mt-3 text-xs font-medium text-amber-800">
                        Your phone number has changed. Save your profile before
                        requesting a verification code.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleRequestCode}
                      disabled={!phoneMatchesSaved || requestingCode || saving}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-[#17472D] px-4 py-2.5 text-sm font-semibold text-[#17472D] transition hover:bg-[#f1f5ef] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestingCode && (
                        <LoaderCircle size={16} className="animate-spin" />
                      )}
                      {requestingCode
                        ? "Sending code..."
                        : codeSent
                          ? "Resend verification code"
                          : "Send verification code"}
                    </button>

                    {codeSent && (
                      <div className="mt-4 space-y-3">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold">
                            Six-digit verification code
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(event) =>
                              setVerificationCode(
                                event.target.value.replace(/\D/g, "").slice(0, 6)
                              )
                            }
                            placeholder="000000"
                            className="w-full rounded-xl border border-[#dfe5da] px-4 py-3 text-sm tracking-[0.3em] outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          disabled={verifyingCode || verificationCode.length !== 6}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103921] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {verifyingCode && (
                            <LoaderCircle size={16} className="animate-spin" />
                          )}
                          {verifyingCode ? "Verifying..." : "Confirm code"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

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
                    Your phone number is shown on your public seller or service
                    listings by default. Turn this off to keep it private.
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
                    Visitors can contact you through WhatsApp when your phone
                    number is public.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={profile.emailPublic}
                  onChange={(event) =>
                    updateField("emailPublic", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-[#17472D]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Allow public email contact
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#879084]">
                    Visitors can see your account email address on your public
                    listings when this option is enabled.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 border-t border-[#e5e9e0] pt-5">
              <h3 className="text-sm font-bold">SMS notifications</h3>
              <p className="mt-1 text-xs leading-5 text-[#879084]">
                Choose whether AgriVanta may send you SMS alerts about new
                messages in your report conversations. This setting does not
                make your phone number public or enable WhatsApp.
              </p>

              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={profile.smsNotificationsEnabled}
                  disabled={!phoneVerified}
                  onChange={(event) =>
                    updateField(
                      "smsNotificationsEnabled",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 accent-[#17472D]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    I agree to receive SMS notifications
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#879084]">
                    You can withdraw this consent at any time by turning this
                    setting off. Standard mobile network charges may apply.
                  </span>
                </span>
              </label>

              {!phoneVerified && (
                <p className="mt-3 text-xs text-amber-800">
                  Verify your phone number before enabling SMS notifications.
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3 rounded-xl bg-[#F8F6EE] p-4">
              <LockKeyhole size={19} className="mt-0.5 shrink-0 text-[#806020]" />
              <p className="text-xs leading-5 text-[#6f6958]">
                Public phone contact, WhatsApp contact, and SMS notifications
                are separate preferences. Removing your phone number disables
                phone verification and SMS consent.
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
