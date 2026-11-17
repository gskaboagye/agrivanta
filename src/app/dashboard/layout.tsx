import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";

export const instant = false;

export default async function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}