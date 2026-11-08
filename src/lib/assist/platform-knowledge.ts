import "server-only";

export type PlatformRole =
  | "farmer"
  | "buyer"
  | "supplier"
  | "worker"
  | "expert";

export const PLATFORM_PAGES = [
  {
    name: "Home",
    path: "/",
    description: "Public AgriVanta homepage.",
    access: "public",
  },
  {
    name: "Marketplace",
    path: "/products",
    description: "Browse agricultural products and listings.",
    access: "public",
  },
  {
    name: "Marketplace",
    path: "/marketplace",
    description: "Additional marketplace page.",
    access: "public",
  },
  {
    name: "Listing details",
    path: "/listings/[id]",
    description: "View an individual listing.",
    access: "public",
  },
  {
    name: "Seller profiles",
    path: "/sellers/[id]",
    description: "View a seller's public profile.",
    access: "public",
  },
  {
    name: "AgriGuide",
    path: "/agriguide",
    description: "Dedicated agricultural AI for farming research and guidance.",
    access: "role-restricted",
    roles: ["farmer", "supplier"],
  },
  {
    name: "Weather",
    path: "/weather",
    description: "Weather information for agricultural users.",
    access: "role-restricted",
    roles: ["farmer", "supplier"],
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    description: "Authenticated account workspace and activity.",
    access: "authenticated",
  },
  {
    name: "Create listing",
    path: "/dashboard/create-listing",
    description: "Create a listing permitted for the account role.",
    access: "authenticated",
  },
  {
    name: "My listings",
    path: "/dashboard/my-listings",
    description: "Manage your own listings.",
    access: "authenticated",
  },
  {
    name: "Inquiries",
    path: "/dashboard/inquiries",
    description: "Review marketplace inquiries.",
    access: "authenticated",
  },
  {
    name: "Messages",
    path: "/dashboard/messages",
    description: "View conversations and messages.",
    access: "authenticated",
  },
  {
    name: "Profile",
    path: "/dashboard/profile",
    description: "Manage account details and contact preferences.",
    access: "authenticated",
  },
  {
    name: "Login",
    path: "/login",
    description: "Sign in to an existing account.",
    access: "public",
  },
  {
    name: "Registration",
    path: "/register",
    description: "Create an AgriVanta account.",
    access: "public",
  },
] as const;

export const LISTING_PERMISSIONS: Record<
  PlatformRole,
  readonly string[]
> = {
  farmer: ["product", "hire"],
  buyer: [],
  supplier: ["product", "service"],
  worker: ["worker"],
  expert: ["expert", "service"],
};

export const ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  farmer: "Can create product and equipment-hire listings.",
  buyer: "Can browse products and contact sellers but cannot create listings.",
  supplier: "Can create product and service listings.",
  worker: "Can create worker listings.",
  expert: "Can create expert and service listings.",
};

export function getPlatformKnowledge(
  role: PlatformRole | null
): string {
  const pages = PLATFORM_PAGES.filter((page) => {
    if (page.access === "public") return true;
    if (page.access === "authenticated") return role !== null;

    return (
      role !== null &&
      "roles" in page &&
      (page.roles as readonly string[]).includes(role)
    );
  }).map(
    (page) => `- ${page.name}: ${page.path}. ${page.description}`
  );

  const roleContext = role
    ? [
        `Authenticated account role: ${role}.`,
        ROLE_DESCRIPTIONS[role],
        `Permitted listing types: ${
          LISTING_PERMISSIONS[role].join(", ") || "None"
        }.`,
      ].join(" ")
    : "The user is a visitor. Recommend only public pages.";

  return [
    "VERIFIED AGRIVANTA PLATFORM KNOWLEDGE",
    roleContext,
    "",
    "AVAILABLE PAGES:",
    ...pages,
    "",
    "IMPORTANT DISTINCTIONS:",
    "- AgriVanta Assist handles platform navigation and support.",
    "- AgriGuide handles agricultural research and farming guidance.",
    "- Redirect detailed farming questions to AgriGuide.",
    "- Never recommend listing types outside the user's role permissions.",
    "- Visitors must sign in before using authenticated dashboard pages.",
    "- Never claim an action was completed unless the application confirms it.",
    "- Never invent routes or platform features.",
    "",
    "NOT YET VERIFIED AS IMPLEMENTED:",
    "- Dedicated agricultural news feed.",
    "- Dedicated feedback submission system.",
    "- Dedicated user reports system.",
    "- Dedicated FAQ and Help Centre.",
    "Do not claim these features are currently available.",
  ].join("\n");
}