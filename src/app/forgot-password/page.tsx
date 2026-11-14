import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ email?: string }>;
};

async function ForgotPasswordContent({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <ForgotPasswordForm initialEmail={params.email ?? ""} />
  );
}

export default function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F8F6EE] text-[#193D2A]">
          Loading password recovery...
        </main>
      }
    >
      <ForgotPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
