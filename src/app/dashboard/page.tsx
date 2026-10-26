
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import DashboardShell from "./dashboard-shell";

export const instant = false;

type RawListing = Record<string, unknown> & {
  _id?: { toString(): string };
};

function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function listingDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return "";
}

function listingPrice(listing: RawListing): string {
  const price = listing.price;

  if (typeof price === "number" && Number.isFinite(price)) {
    const currency = asText(listing.currency, "GHS");
    return `${currency} ${price.toLocaleString("en-GH")}`;
  }

  if (typeof price === "string" && price.trim()) {
    return price;
  }

  return "Contact seller";
}

function toListingPreview(listing: RawListing) {
  return {
    id: listing._id?.toString() ?? "",
    title: asText(listing.title, asText(listing.name, "Untitled listing")),
    category: asText(listing.category, asText(listing.type, "Agriculture")),
    location: asText(listing.location, "Location not specified"),
    price: listingPrice(listing),
    image: asText(
      listing.imageUrl,
      asText(listing.image, asText(listing.imageURL, ""))
    ),
    type: asText(listing.type, "product"),
    date: listingDate(listing.createdAt),
  };
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const user = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };

  let marketplaceListings = 0;
  let activeListings = 0;
  let recentListings: ReturnType<typeof toListingPreview>[] = [];

  try {
    const db = await getDatabase();
    const listings = db.collection<RawListing>("listings");

    marketplaceListings = await listings.countDocuments({
      status: "active",
    });

    // Count listings linked to this user using common ownership fields.
    // If your listing schema uses a different field, adjust this query.
    const ownerConditions: Record<string, unknown>[] = [];

    if (user.id) {
      ownerConditions.push(
        { userId: user.id },
        { sellerId: user.id },
        { ownerId: user.id },
        { createdBy: user.id }
      );
    }

    if (user.email) {
      ownerConditions.push(
        { userEmail: user.email },
        { sellerEmail: user.email },
        { ownerEmail: user.email }
      );
    }

    if (ownerConditions.length > 0) {
      activeListings = await listings.countDocuments({
        status: "active",
        $or: ownerConditions,
      });
    }

    const documents = await listings
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    recentListings = documents.map(toListingPreview);
  } catch (error) {
    // Keep the dashboard usable even if the database is temporarily unavailable.
    console.error("Dashboard marketplace lookup failed:", error);
  }

  return (
    <DashboardShell
      user={user}
      stats={{
        activeListings,
        marketplaceListings,
      }}
      recentListings={recentListings}
    />
  );
}
