
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "agrivanta";

if (!uri) {
  throw new Error("MONGODB_URI is missing from .env.local");
}

const listings = [
  {
    title: "Fresh Tomatoes",
    type: "product",
    category: "Farm Produce",
    description:
      "Fresh tomatoes for households, food vendors and bulk buyers.",
    price: 180,
    priceUnit: "per crate (demo price)",
    location: "Techiman, Bono East",
    seller: "Demo Farm Produce Seller",
    image:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=75",
    mediaCount: 3,
  },
  {
    title: "Yellow Maize",
    type: "product",
    category: "Grains & Cereals",
    description:
      "Yellow maize for food processing, livestock feed and other uses.",
    price: 350,
    priceUnit: "per 50 kg bag (demo price)",
    location: "Ejura, Ashanti",
    seller: "Demo Grain Supplier",
    image:
      "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=75",
    mediaCount: 2,
  },
  {
    title: "Farm Seedlings",
    type: "product",
    category: "Seeds & Seedlings",
    description:
      "Seedling trays for farmers preparing for a new growing cycle.",
    price: 85,
    priceUnit: "per tray (demo price)",
    location: "Kumasi, Ashanti",
    seller: "Demo Nursery",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=75",
    mediaCount: 4,
  },
  {
    title: "Tractor for Hire",
    type: "hire",
    category: "Farm Equipment",
    description:
      "Tractor hire for land preparation. Confirm operator availability, acreage and service area.",
    price: 1200,
    priceUnit: "per day (demo rate)",
    location: "Ejura, Ashanti",
    seller: "Demo Machinery Provider",
    image:
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=75",
    mediaCount: 5,
  },
  {
    title: "Irrigation Pump for Hire",
    type: "hire",
    category: "Farm Equipment",
    description:
      "Irrigation pump hire for farm watering. Confirm capacity, fuel and collection terms.",
    price: 250,
    priceUnit: "per day (demo rate)",
    location: "Tamale, Northern",
    seller: "Demo Equipment Provider",
    image:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=75",
    mediaCount: 2,
  },
  {
    title: "Land Preparation Service",
    type: "service",
    category: "Farm Services",
    description:
      "Land preparation services. Discuss acreage, terrain, equipment and scheduling with the provider.",
    price: 500,
    priceUnit: "starting price (demo)",
    location: "Kumasi, Ashanti",
    seller: "Demo Farm Services",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=75",
    mediaCount: 3,
  },
  {
    title: "Agricultural Sprayer",
    type: "hire",
    category: "Farm Equipment",
    description:
      "Agricultural sprayer available for hire, subject to availability and agreed operating requirements.",
    price: 100,
    priceUnit: "per day (demo rate)",
    location: "Accra, Greater Accra",
    seller: "Demo Tool Provider",
    image:
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=75",
    mediaCount: 2,
  },
  {
    title: "Farm Labourer",
    type: "worker",
    category: "Agricultural Labourers",
    description:
      "Demo worker profile for general farm duties, including planting, weeding, harvesting and produce handling.",
    price: 100,
    priceUnit: "per day (demo rate)",
    location: "Ejura, Ashanti",
    seller: "Demo Worker Profile 01",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=75",
    mediaCount: 1,
    skills: ["Planting", "Weeding", "Harvesting", "Sorting produce"],
    experience: "2 years (sample profile)",
    availability: "Availability must be confirmed",
  },
  {
    title: "Harvesting Team",
    type: "worker",
    category: "Agricultural Labourers",
    description:
      "Demo team profile for farmers seeking seasonal workers for harvesting, packing and post-harvest activities.",
    price: 400,
    priceUnit: "per team per day (demo rate)",
    location: "Techiman, Bono East",
    seller: "Demo Harvest Team",
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=75",
    mediaCount: 2,
    skills: ["Harvesting", "Packing", "Sorting", "Seasonal farm work"],
    experience: "Team experience not verified",
    availability: "Dates and team size must be confirmed",
  },
  {
    title: "Agronomist and Crop Adviser",
    type: "expert",
    category: "Agricultural Experts",
    description:
      "Demo expert profile for crop planning, farm visits, crop management advice and production improvement consultations.",
    price: 250,
    priceUnit: "per consultation (demo rate)",
    location: "Kumasi, Ashanti",
    seller: "Demo Agronomist Profile",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=75",
    mediaCount: 2,
    skills: [
      "Crop planning",
      "Crop management",
      "Farm consultations",
      "Production planning",
    ],
    experience: "Qualifications and experience not verified",
    availability: "Appointments must be confirmed",
  },
  {
    title: "Soil and Fertility Consultant",
    type: "expert",
    category: "Agricultural Experts",
    description:
      "Demo profile for soil fertility consultations, soil sampling guidance and fertilizer planning.",
    price: 300,
    priceUnit: "starting consultation fee (demo)",
    location: "Accra, Greater Accra",
    seller: "Demo Soil Consultant",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=75",
    mediaCount: 1,
    skills: [
      "Soil fertility",
      "Soil sampling guidance",
      "Fertilizer planning",
    ],
    experience: "Credentials not verified",
    availability: "Availability must be confirmed",
  },
  {
    title: "Livestock Management Adviser",
    type: "expert",
    category: "Agricultural Experts",
    description:
      "Demo profile for livestock husbandry, feeding practices and farm management consultations.",
    price: 200,
    priceUnit: "per consultation (demo rate)",
    location: "Tamale, Northern",
    seller: "Demo Livestock Adviser",
    image:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=75",
    mediaCount: 2,
    skills: [
      "Livestock husbandry",
      "Feeding management",
      "Farm management",
    ],
    experience: "Credentials not verified",
    availability: "Appointments must be confirmed",
  },
];

async function main() {
  const client = new MongoClient(uri!);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection("listings");
    const now = new Date();

    const operations = listings.map((listing) => ({
      updateOne: {
        filter: {
          title: listing.title,
          seller: listing.seller,
          isDemo: true,
        },
        update: {
          $set: {
            ...listing,
            status: "active",
            isDemo: true,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations);

    console.log("AgriVanta demo listings seeded successfully.");
    console.log(`Listings processed: ${listings.length}`);
    console.log(`Inserted: ${result.upsertedCount}`);
    console.log(`Updated: ${result.modifiedCount}`);
    console.log("These records are marked isDemo: true.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Failed to seed listings:", error);
  process.exitCode = 1;
});
