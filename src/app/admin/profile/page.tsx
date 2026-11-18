
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserCircle,
  Phone,
  Bell,
  ShieldCheck,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

type AdminProfile = {
  phone: string;
  phoneVerified: boolean;
  smsNotificationsEnabled: boolean;
};

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile>({
    phone: "",
    phoneVerified: false,
    smsNotificationsEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);

  const phoneHasChanged = profile.phone.trim() !== savedPhone;

  useEffect(() => {
    if (resendAfter <= 0) return;

    const timer = window.setTimeout(() => {
      setResendAfter((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendAfter]);

  async function handleRequestVerification() {
    setError("");
    setSuccess("");
    setRequestingCode(true);

    try {
      const response = await fetch(
        "/api/admin/administrators/phone-verification/request",
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send verification code.");
      }

      if (result.alreadyVerified) {
        setProfile((current) => ({ ...current, phoneVerified: true }));
        setSuccess(result.message);
        return;
      }

      setCodeSent(true);
      setVerificationCode("");
      setResendAfter(result.resendAfterSeconds || 60);
      setSuccess(result.message || "Verification code sent.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send verification code."
      );
    } finally {
      setRequestingCode(false);
    }
  }

  async function handleVerifyPhone() {
    setError("");
    setSuccess("");
    setVerifyingCode(true);

    try {
      const response = await fetch(
        "/api/admin/administrators/phone-verification/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: verificationCode }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to verify phone number.");
      }

      setProfile((current) => ({ ...current, phoneVerified: true }));
      setCodeSent(false);
      setVerificationCode("");
      setResendAfter(0);
      setSuccess(result.message || "Phone number verified successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to verify phone number."
      );
    } finally {
      setVerifyingCode(false);
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          "/api/admin/administrators/profile",
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load administrator profile."
          );
        }

        setProfile({
          phone: result.profile.phone || "",
          phoneVerified: result.profile.phoneVerified === true,
          smsNotificationsEnabled:
            result.profile.smsNotificationsEnabled === true,
        });
        setSavedPhone(result.profile.phone || '');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/administrators/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: profile.phone.trim(),
            smsNotificationsEnabled: profile.smsNotificationsEnabled,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update your profile."
        );
      }

      setProfile({
        phone: result.profile.phone || "",
        phoneVerified: result.profile.phoneVerified === true,
        smsNotificationsEnabled:
          result.profile.smsNotificationsEnabled === true,
      });
      setSavedPhone(result.profile.phone || '');
      setCodeSent(false);
      setVerificationCode('');
      setResendAfter(0);

      setSuccess(result.message || "Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
        <div className="flex items-center gap-3 text-sm font-medium text-[#17472D]">
          <LoaderCircle className="animate-spin" size={20} />
          Loading administrator profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8F4] text-[#26372b]">
      <header className="border-b border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-semibold text-[#17472D] transition hover:text-[#326b43]"
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </Link>

          <span className="text-sm font-extrabold tracking-tight text-[#17472D]">
            AgriVanta Administration
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-9 sm:px-8">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#74816f]">
            <UserCircle size={16} />
            Account management
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#17472D] sm:text-3xl">
            Administrator Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7c8879]">
            Manage your administrator contact details and choose whether
            you want to receive important report conversation notifications
            through SMS.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone number */}
          <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                <Phone size={21} />
              </span>

              <div>
                <h2 className="font-bold text-[#26372b]">
                  Contact phone number
                </h2>
                <p className="mt-1 text-sm leading-5 text-[#899487]">
                  Add the Ghanaian mobile number where you would like to
                  receive administrator notifications.
                </p>
              </div>
            </div>

            <label
              htmlFor="admin-phone"
              className="mb-2 block text-sm font-semibold text-[#354737]"
            >
              Mobile phone number
            </label>

            <input
              id="admin-phone"
              type="tel"
              value={profile.phone}
              onChange={(event) => {
                setProfile((current) => ({
                  ...current,
                  phone: event.target.value,
                  phoneVerified:
                    event.target.value.trim() === current.phone.trim()
                      ? current.phoneVerified
                      : false,
                }));
                setSuccess("");
              }}
              placeholder="+233XXXXXXXXX"
              maxLength={20}
              className="w-full rounded-xl border border-[#dfe5dc] bg-[#fbfcfa] px-4 py-3 text-sm text-[#26372b] outline-none transition placeholder:text-[#a4ada0] focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile.phoneVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <ShieldCheck size={14} />
                  Phone number verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <AlertCircle size={14} />
                  Phone number not verified
                </span>
              )}
            </div>

            {!profile.phoneVerified && (
              <div className="mt-4 space-y-3">
                {phoneHasChanged ? (
                  <p className="text-sm text-amber-700">
                    Save your phone number before requesting verification.
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleRequestVerification}
                      disabled={
                        requestingCode ||
                        resendAfter > 0 ||
                        !/^\+233\d{9}$/.test(profile.phone.trim())
                      }
                      className="rounded-xl bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103820] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestingCode
                        ? "Sending code..."
                        : resendAfter > 0
                          ? `Resend code in ${resendAfter}s`
                          : codeSent
                            ? "Resend verification code"
                            : "Send verification code"}
                    </button>

                    {codeSent && (
                      <div className="space-y-3 rounded-xl border border-[#e5e9e1] bg-[#fbfcfa] p-4">
                        <label
                          htmlFor="admin-phone-verification-code"
                          className="block text-sm font-semibold text-[#354737]"
                        >
                          Enter the six-digit verification code
                        </label>

                        <input
                          id="admin-phone-verification-code"
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
                          className="w-full max-w-xs rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-[#26372b] outline-none focus:border-[#17472D] focus:ring-2 focus:ring-[#17472D]/10"
                        />

                        <button
                          type="button"
                          onClick={handleVerifyPhone}
                          disabled={verifyingCode || verificationCode.length !== 6}
                          className="rounded-xl bg-[#17472D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103820] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {verifyingCode ? "Verifying..." : "Verify phone number"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <p className="mt-3 text-xs leading-5 text-[#899487]">
              Use the international Ghana format, for example
              +233 followed by your nine-digit mobile number.
              Changing your phone number resets its verification status.
            </p>
          </section>

          {/* SMS preferences */}
          <section className="rounded-2xl border border-[#e5e9e1] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17472D]/10 text-[#17472D]">
                <Bell size={21} />
              </span>

              <div>
                <h2 className="font-bold text-[#26372b]">
                  SMS notification preferences
                </h2>
                <p className="mt-1 text-sm leading-5 text-[#899487]">
                  Choose whether AgriVanta can send you SMS notifications
                  about report conversations.
                </p>
              </div>
            </div>

            <label
              htmlFor="sms-notifications"
              className="flex cursor-pointer items-start gap-4 rounded-xl border border-[#e5e9e1] bg-[#fbfcfa] p-4"
            >
              <input
                id="sms-notifications"
                type="checkbox"
                checked={profile.smsNotificationsEnabled}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    smsNotificationsEnabled: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 accent-[#17472D]"
              />

              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-bold text-[#354737]">
                  <MessageSquare size={16} className="text-[#17472D]" />
                  Enable SMS notifications
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#899487]">
                  I agree to receive SMS notifications about messages
                  and updates relating to user reports on AgriVanta.
                </span>
              </span>
            </label>

            {!profile.phoneVerified && profile.smsNotificationsEnabled && (
              <p className="mt-3 text-xs leading-5 text-amber-700">
                Your preference can be saved, but SMS notifications
                cannot be delivered until your phone number has been
                verified.
              </p>
            )}

            <div className="mt-4 rounded-xl bg-[#F7F8F4] p-4">
              <p className="text-xs leading-5 text-[#74816f]">
                Email notifications remain separate from this setting.
                Enabling SMS does not disable email notifications.
                SMS notifications are sent to your verified phone
                number when you have enabled this preference.
              </p>
            </div>
          </section>

          {/* Save */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl border border-[#dfe5dc] bg-white px-5 py-3 text-sm font-semibold text-[#52604f] transition hover:bg-[#f7f8f4]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17472D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#245c39] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving changes..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
