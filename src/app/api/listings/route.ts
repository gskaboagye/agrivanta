

import { NextRequest, NextResponse } from "next/server";

import { getDatabase } from "@/lib/mongodb";

import { getCurrentUser } from "@/lib/auth";



const allowedTypes = [

  "product",

  "hire",

  "service",

  "worker",

  "expert",

] as const;



type ListingType = (typeof allowedTypes)[number];



const rolePermissions: Record<string, readonly ListingType[]> = {

  farmer: ["product", "hire"],

  buyer: [],

  supplier: ["product", "service"],

  worker: ["worker"],

  expert: ["expert", "service"],

};



const fieldLimits: Record<string, number> = {

  title: 120,

  category: 80,

  subcategory: 100,

  description: 5000,

  priceUnit: 40,

  location: 120,

  image: 2000,

  experience: 500,

  availability: 500,

};



const MAX_IMAGES = 8;

const MAX_VIDEOS = 2;

const MAX_MEDIA = 8;



function validText(

  value: unknown,

  maxLength: number

): value is string {

  return (

    typeof value === "string" &&

    value.trim().length > 0 &&

    value.trim().length <= maxLength

  );

}



function isCloudinaryUrl(value: unknown): value is string {

  if (typeof value !== "string" || value.length > 2000) {

    return false;

  }



  try {

    const url = new URL(value);



    return (

      url.protocol === "https:" &&

      url.hostname === "res.cloudinary.com"

    );

  } catch {

    return false;

  }

}



function isValidSpecifications(value: unknown): boolean {

  if (

    typeof value !== "object" ||

    value === null ||

    Array.isArray(value)

  ) {

    return false;

  }



  const entries = Object.entries(value);



  if (entries.length > 40) {

    return false;

  }



  return entries.every(([key, item]) => {

    if (!key.trim() || key.length > 100) {

      return false;

    }



    if (typeof item === "string") {

      return item.length <= 500;

    }



    if (typeof item === "number") {

      return Number.isFinite(item) && item >= 0;

    }



    return typeof item === "boolean";

  });

}



function isValidMediaArray(

  value: unknown,

  maxLength: number

): value is string[] {

  return (

    Array.isArray(value) &&

    value.length <= maxLength &&

    value.every(isCloudinaryUrl)

  );

}



function isValidMediaObjects(value: unknown): boolean {

  if (!Array.isArray(value) || value.length > MAX_MEDIA) {

    return false;

  }



  return value.every((item) => {

    if (

      typeof item !== "object" ||

      item === null ||

      Array.isArray(item)

    ) {

      return false;

    }



    const media = item as Record<string, unknown>;



    return (

      isCloudinaryUrl(media.secure_url) &&

      (media.type === "image" || media.type === "video") &&

      (media.resource_type === "image" ||

        media.resource_type === "video")

    );

  });

}



/**

 * Resolve the seller's account ID from a listing.

 * Ownership identifiers are not returned publicly.

 */

function getSellerProfileId(

  document: Record<string, unknown>

): string | undefined {

  const fields = ["sellerId", "userId", "ownerId", "createdBy"];



  for (const field of fields) {

    const value = document[field];



    if (typeof value === "string" && value.trim()) {

      return value.trim();

    }



    if (

      value !== null &&

      typeof value === "object" &&

      "toString" in value &&

      typeof value.toString === "function"

    ) {

      const id = value.toString();



      if (id && id !== "[object Object]") {

        return id;

      }

    }

  }



  return undefined;

}



export async function GET(request: NextRequest) {

  try {

    const db = await getDatabase();

    const params = request.nextUrl.searchParams;



    const type = params.get("type");

    const category = params.get("category");

    const subcategory = params.get("subcategory");

    const location = params.get("location");

    const search = params.get("q")?.trim();



    if (

      type &&

      !(allowedTypes as readonly string[]).includes(type)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing type.",

        },

        { status: 400 }

      );

    }



    if (

      (category && category.length > 80) ||

      (subcategory && subcategory.length > 100) ||

      (location && location.length > 120) ||

      (search && search.length > 100)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Search filters are too long.",

        },

        { status: 400 }

      );

    }



    const filter: Record<string, unknown> = {

      status: "active",

    };



    if (type) filter.type = type;

    if (category) filter.category = category;

    if (subcategory) filter.subcategory = subcategory;

    if (location) filter.location = location;



    if (search) {

      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );



      filter.$or = [

        { title: { $regex: escaped, $options: "i" } },

        { category: { $regex: escaped, $options: "i" } },

        { subcategory: { $regex: escaped, $options: "i" } },

        { description: { $regex: escaped, $options: "i" } },

        { location: { $regex: escaped, $options: "i" } },

        { skills: { $regex: escaped, $options: "i" } },

      ];

    }



    const listings = await db

      .collection("listings")

      .find(filter)

      .sort({ createdAt: -1 })

      .limit(100)

      .toArray();



    return NextResponse.json({

      success: true,

      count: listings.length,

      listings: listings.map((document) => ({
        id: document._id.toString(),
        title: document.title,
        type: document.type,
        category: document.category,
        subcategory: document.subcategory ?? "",
        specifications: document.specifications ?? {},
        description: document.description,
        price: document.price,
        priceUnit: document.priceUnit ?? document.unit ?? "Price to be confirmed",
        location: document.location,
        seller: document.seller ?? "Seller not specified",
        sellerProfileId: getSellerProfileId(document),
        image: document.image ?? "",
        images: document.images ?? [],
        videos: document.videos ?? [],
        media: document.media ?? [],
        mediaCount: document.mediaCount ?? 0,
        skills: document.skills ?? [],
        experience: document.experience ?? "",
        availability: document.availability ?? "",
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      })),

    });

  } catch (error) {

    console.error("Failed to retrieve listings:", error);



    return NextResponse.json(

      {

        success: false,

        message: "Unable to load listings.",

      },

      { status: 500 }

    );

  }

}



export async function POST(request: NextRequest) {

  try {

    const user = await getCurrentUser();



    if (!user) {

      return NextResponse.json(

        {

          success: false,

          message: "Please log in before creating a listing.",

        },

        { status: 401 }

      );

    }



    const permittedTypes = rolePermissions[user.role] ?? [];



    if (permittedTypes.length === 0) {

      return NextResponse.json(

        {

          success: false,

          message:

            "Your account type does not have permission to create listings.",

        },

        { status: 403 }

      );

    }



    const body: unknown = await request.json();



    if (

      !body ||

      typeof body !== "object" ||

      Array.isArray(body)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid request body.",

        },

        { status: 400 }

      );

    }



    const data = body as Record<string, unknown>;



    const requiredLimits = {

      title: fieldLimits.title,

      category: fieldLimits.category,

      description: fieldLimits.description,

      priceUnit: fieldLimits.priceUnit,

      location: fieldLimits.location,

    };



    const requiredFieldsValid = Object.entries(

      requiredLimits

    ).every(([key, maxLength]) =>

      validText(data[key], maxLength)

    );



    if (

      !requiredFieldsValid ||

      typeof data.type !== "string" ||

      !(allowedTypes as readonly string[]).includes(data.type) ||

      !permittedTypes.includes(data.type as ListingType) ||

      typeof data.price !== "number" ||

      !Number.isFinite(data.price) ||

      data.price < 0 ||

      data.price > 1_000_000_000

    ) {

      return NextResponse.json(

        {

          success: false,

          message:

            "Please provide valid listing details for your account type.",

        },

        { status: 400 }

      );

    }



    const subcategory = data.subcategory;



    if (

      subcategory !== undefined &&

      !validText(subcategory, fieldLimits.subcategory)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing subcategory.",

        },

        { status: 400 }

      );

    }



    if (

      data.specifications !== undefined &&

      !isValidSpecifications(data.specifications)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing specifications.",

        },

        { status: 400 }

      );

    }



    if (

      data.image !== undefined &&

      data.image !== "" &&

      !isCloudinaryUrl(data.image)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing image URL.",

        },

        { status: 400 }

      );

    }



    const images =

      data.images === undefined ? [] : data.images;



    const videos =

      data.videos === undefined ? [] : data.videos;



    if (!isValidMediaArray(images, MAX_IMAGES)) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing images.",

        },

        { status: 400 }

      );

    }



    if (!isValidMediaArray(videos, MAX_VIDEOS)) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing videos.",

        },

        { status: 400 }

      );

    }



    if (

      data.media !== undefined &&

      !isValidMediaObjects(data.media)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid listing media.",

        },

        { status: 400 }

      );

    }



    if (images.length + videos.length > MAX_MEDIA) {

      return NextResponse.json(

        {

          success: false,

          message: `You can attach up to ${MAX_MEDIA} media files.`,

        },

        { status: 400 }

      );

    }



    if (

      data.skills !== undefined &&

      (!Array.isArray(data.skills) ||

        data.skills.length > 50 ||

        !data.skills.every(

          (skill) =>

            typeof skill === "string" &&

            skill.trim().length > 0 &&

            skill.trim().length <= 80

        ))

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid skills.",

        },

        { status: 400 }

      );

    }



    if (

      data.experience !== undefined &&

      (typeof data.experience !== "string" ||

        data.experience.length > fieldLimits.experience)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid experience.",

        },

        { status: 400 }

      );

    }



    if (

      data.availability !== undefined &&

      (typeof data.availability !== "string" ||

        data.availability.length > fieldLimits.availability)

    ) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid availability.",

        },

        { status: 400 }

      );

    }



    const primaryImage =

      typeof data.image === "string" && data.image.trim()

        ? data.image.trim()

        : images[0] ?? "";



    if (!primaryImage) {

      return NextResponse.json(

        {

          success: false,

          message: "Upload at least one image for your listing.",

        },

        { status: 400 }

      );

    }



    const db = await getDatabase();

    const now = new Date();



    const listing = {

      title: (data.title as string).trim(),

      type: data.type as ListingType,

      category: (data.category as string).trim(),

      subcategory:

        typeof subcategory === "string"

          ? subcategory.trim()

          : "",

      specifications:

        data.specifications &&

        typeof data.specifications === "object" &&

        !Array.isArray(data.specifications)

          ? data.specifications

          : {},

      description: (data.description as string).trim(),

      price: data.price,

      priceUnit: (data.priceUnit as string).trim(),

      location: (data.location as string).trim(),



      // Seller identity comes from the authenticated account.

      seller: user.name,

      userId: user.id,

      userEmail: user.email,

      sellerId: user.id,

      sellerEmail: user.email,

      ownerId: user.id,

      ownerEmail: user.email,

      createdBy: user.id,

      sellerRole: user.role,



      image: primaryImage,

      images,

      videos,

      media: Array.isArray(data.media) ? data.media : [],

      skills: Array.isArray(data.skills)

        ? data.skills.map((skill) => (skill as string).trim())

        : [],

      experience:

        typeof data.experience === "string"

          ? data.experience.trim()

          : "",

      availability:

        typeof data.availability === "string"

          ? data.availability.trim()

          : "",

      mediaCount: Math.max(

        images.length + videos.length,

        primaryImage ? 1 : 0

      ),

      status: "active",

      createdAt: now,

      updatedAt: now,

    };



    const result = await db

      .collection("listings")

      .insertOne(listing);



    return NextResponse.json(

      {

        success: true,

        message: "Listing created successfully.",

        id: result.insertedId.toString(),

      },

      { status: 201 }

    );

  } catch (error) {

    if (error instanceof SyntaxError) {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid JSON request body.",

        },

        { status: 400 }

      );

    }



    console.error("Failed to create listing:", error);



    return NextResponse.json(

      {

        success: false,

        message: "Unable to create listing.",

      },

      { status: 500 }

    );

  }

}
