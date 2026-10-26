
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
    category: "Vegetables",
    description: "Fresh tomatoes available for households, retailers and food vendors.",
    price: 250,
    unit: "crate",
    location: "Accra, Ghana",
    seller: "Green Valley Farms",
  },
  {
    title: "Yellow Maize",
    type: "product",
    category: "Grains",
    description: "Quality yellow maize suitable for food processing and animal feed.",
    price: 180,
    unit: "bag",
    location: "Kumasi, Ghana",
    seller: "Ashanti Agro Supplies",
  },
  {
    title: "Farm Seedlings",
    type: "product",
    category: "Seeds and Seedlings",
    description: "Healthy seedlings for farmers preparing for the next planting season.",
    price: 5,
    unit: "seedling",
    location: "Nsawam, Ghana",
    seller: "Green Valley Farms",
  },
  {
    title: "Tractor for Hire",
    type: "hire",
    category: "Farm Machinery",
    description: "Tractor available for ploughing and land preparation.",
    price: 1200,
    unit: "day",
    location: "Tamale, Ghana",
    seller: "Northern Machinery Services",
  },
  {
    title: "Irrigation Pump for Hire",
    type: "hire",
    category: "Irrigation Equipment",
    description: "Irrigation pump available for short-term farm use.",
    price: 150,
    unit: "day",
    location: "Accra, Ghana",
    seller: "Agro Equipment Hub",
  },
  {
    title: "Land Preparation Service",
    type: "service",
    category: "Land Preparation",
    description: "Professional land clearing and preparation for planting.",
    price: 800,
    unit: "acre",
    location: "Kumasi, Ghana",
    seller: "FarmWorks Ghana",
  },
  {
    title: "Agricultural Sprayer",
    type: "product",
    category: "Farm Equipment",
    description: "Agricultural sprayer for applying approved crop treatments.",
    price: 350,
    unit: "unit",
    location: "Accra, Ghana",
    seller: "Agro Equipment Hub",
  },
  {
    title: "Farm Labourer",
    type: "worker",
    category: "Farm Labour",
    description: "Farm worker available to assist with routine farm activities.",
    price: 100,
    unit: "day",
    location: "Nsawam, Ghana",
    seller: "Kwame Mensah",
  },
  {
    title: "Harvesting Team",
    type: "worker",
    category: "Harvesting",
    description: "Experienced team available for seasonal harvesting work.",
    price: 500,
    unit: "team/day",
    location: "Kumasi, Ghana",
    seller: "Harvest Support Team",
  },
  {
    title: "Agronomist and Crop Adviser",
    type: "expert",
    category: "Agronomy",
    description: "Crop management guidance, field assessments and farming advice.",
    price: 300,
    unit: "consultation",
    location: "Accra, Ghana",
    seller: "AgriConsult Ghana",
  },
  {
    title: "Soil and Fertility Consultant",
    type: "expert",
    category: "Soil Management",
    description: "Advice on soil health, soil testing and nutrient management.",
    price: 250,
    unit: "consultation",
    location: "Tamale, Ghana",
    seller: "SoilCare Consultants",
  },
  {
    title: "Livestock Management Adviser",
    type: "expert",
    category: "Livestock",
    description: "Guidance on livestock feeding, housing and farm management.",
    price: 280,
    unit: "consultation",
    location: "Kumasi, Ghana",
    seller: "Livestock Advisory Ghana",
  },
];

async function seedListings() {
  const client = new MongoClient(uri!);

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection("listings");

    let inserted = 0;
    let updated = 0;

    for (const listing of listings) {
      const result = await collection.updateOne(
        {
          title: listing.title,
          seller: listing.seller,
          isDemo: true,
        },
        {
          $set: {
            ...listing,
            status: "active",
            isDemo: true,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        inserted++;
      } else if (result.matchedCount > 0) {
        updated++;
      }
    }

    console.log("AgriVanta demo listings seeded successfully.");
    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total processed: ${listings.length}`);
  } catch (error) {
    console.error("Failed to seed listings:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

seedListings();
