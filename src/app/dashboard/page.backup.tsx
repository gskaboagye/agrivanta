import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./logout-button";

export const instant = false;
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleLabels: Record<string, string> = {
    farmer: "Farmer",
    buyer: "Buyer",
    supplier: "Supplier / Service Provider",
    worker: "Farm Worker",
    expert: "Agricultural Expert",
  };

  return (
    <main className="min-h-screen bg-[#F8F6EE] text-[#193D2A]">
      <header className="border-b border-[#E7E4D9] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-xl font-extrabold">
            AgriVanta
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-[#9B741F]">
          Your account
        </p>

        <h1 className="mt-3 text-3xl font-extrabold">
          Welcome, {user.name}
        </h1>

        <p className="mt-3 text-[#718071]">
          You're signed in to AgriVanta.
        </p>

        <div className="mt-8 rounded-2xl border border-[#E7E4D9] bg-white p-6">
          <h2 className="text-lg font-bold">Account details</h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-[#718071]">Full name</dt>
              <dd className="mt-1 font-semibold">{user.name}</dd>
            </div>

            <div>
              <dt className="text-[#718071]">Email</dt>
              <dd className="mt-1 font-semibold">{user.email}</dd>
            </div>

            <div>
              <dt className="text-[#718071]">Phone</dt>
              <dd className="mt-1 font-semibold">
                {user.phone || "Not provided"}
              </dd>
            </div>

            <div>
              <dt className="text-[#718071]">Account type</dt>
              <dd className="mt-1 font-semibold">
                {roleLabels[user.role] ?? user.role}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-xl border border-[#E7E4D9] bg-white p-5">
          <h2 className="font-bold">Explore the marketplace</h2>
          <p className="mt-2 text-sm leading-6 text-[#718071]">
            Browse agricultural products, equipment, services and
            professional opportunities.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex rounded-lg bg-[#17472D] px-5 py-3 text-sm font-bold text-white hover:bg-[#235B3A]"
          >
            Visit marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}