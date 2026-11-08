import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AgriGuideClient from "./agriguide-client";

export const instant = false;

export default async function AgriGuidePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=%2Fagriguide");
  }

  if (user.role !== "farmer" && user.role !== "supplier") {
    redirect("/dashboard");
  }

  return <AgriGuideClient />;
}