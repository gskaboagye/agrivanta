import { Suspense } from "react";
import VerifyAccountForm from "./verify-account-form";

type VerifyAccountPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

async function VerifyAccountContent({
  searchParams,
}: VerifyAccountPageProps) {
  const params = await searchParams;

  return <VerifyAccountForm initialEmail={params.email ?? ""} />;
}

export default function VerifyAccountPage({
  searchParams,
}: VerifyAccountPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F8F4]">
          <p className="text-sm text-[#526252]">
            Loading account verification...
          </p>
        </main>
      }
    >
      <VerifyAccountContent searchParams={searchParams} />
    </Suspense>
  );
}
