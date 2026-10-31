import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import WeatherClient from "./weather-client";

export const instant = false;

export default async function WeatherPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "farmer" && user.role !== "supplier") {
    redirect("/dashboard");
  }

  return <WeatherClient />;
}