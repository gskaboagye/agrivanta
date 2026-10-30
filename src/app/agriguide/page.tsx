import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AgriGuideClient from "./agriguide-client";

export const dynamic = "force-dynamic";

export default async function AgriGuidePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "farmer" && user.role !== "supplier") {
    redirect("/dashboard");
  }

  return <AgriGuideClient />;
}