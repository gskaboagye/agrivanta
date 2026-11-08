import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import cloudinary from "@/lib/cloudinary";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function uploadToCloudinary(buffer: Buffer): Promise<{
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "agrivanta/news",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned no upload result."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select an image." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, message: "The selected image is empty." },
        { status: 400 }
      );
    }

    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Use a JPG, PNG, WebP or AVIF image.",
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Images must be 10 MB or smaller.",
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToCloudinary(buffer);

    return NextResponse.json(
      {
        success: true,
        message: "News cover image uploaded successfully.",
        image: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator access required.",
        },
        { status: 401 }
      );
    }

    console.error("Admin news image upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to upload the news image.",
      },
      { status: 500 }
    );
  }
}