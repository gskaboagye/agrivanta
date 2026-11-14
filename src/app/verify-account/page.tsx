import VerifyAccountForm from "./verify-account-form";

type VerifyAccountPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyAccountPage({
  searchParams,
}: VerifyAccountPageProps) {
  const params = await searchParams;

  return (
    <VerifyAccountForm initialEmail={params.email ?? ""} />
  );
}
