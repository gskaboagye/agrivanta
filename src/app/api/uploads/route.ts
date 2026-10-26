
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";


const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function uploadToCloudinary(
  buffer: Buffer,
  resourceType: "image" | "video",
  format: string
): Promise<{
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "agrivanta/listings",
        resource_type: resourceType,
        allowed_formats:
          resourceType === "image"
            ? ["jpg", "jpeg", "png", "webp", "avif"]
            : ["mp4", "webm", "mov"],
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
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
        });
      }
    );

    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    // Require a same-origin request when the browser supplies an Origin.
    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    // Verify the existing AgriVanta session.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to upload media." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image or video." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    const isImage = IMAGE_TYPES.has(file.type);
    const isVideo = VIDEO_TYPES.has(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, WebP, AVIF, MP4, WebM, or MOV file." },
        { status: 415 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isImage
            ? "Images must be 10 MB or smaller."
            : "Videos must be 50 MB or smaller.",
        },
        { status: 413 }
      );
    }

    // Avoid buffering oversized requests into memory.
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await uploadToCloudinary(
      buffer,
      isImage ? "image" : "video",
      file.name.split(".").pop()?.toLowerCase() || ""
    );

    return NextResponse.json(
      {
        message: "Media uploaded successfully.",
        media: {
          ...uploaded,
          type: isImage ? "image" : "video",
          originalName: file.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("AgriVanta media upload failed:", error);

    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
