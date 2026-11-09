import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import cloudinary from "@/lib/cloudinary";

const MAX_PDF_SIZE = 20 * 1024 * 1024;

function uploadToCloudinary(buffer: Buffer): Promise<{
  secure_url: string;
  public_id: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "agrivanta/reports",
        resource_type: "raw",
        public_id: `report-${randomUUID()}.pdf`,
        overwrite: false,
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
          bytes: result.bytes,
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
        { success: false, message: "Please select a PDF document." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, message: "The selected PDF is empty." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "Only PDF documents are accepted." },
        { status: 415 }
      );
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "PDF documents must be 20 MB or smaller.",
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const pdfSignature = buffer.subarray(0, 5).toString("ascii");

    if (pdfSignature !== "%PDF-") {
      return NextResponse.json(
        {
          success: false,
          message: "The selected file is not a valid PDF document.",
        },
        { status: 415 }
      );
    }

    const uploaded = await uploadToCloudinary(buffer);

    return NextResponse.json(
      {
        success: true,
        message: "Agricultural report PDF uploaded successfully.",
        file: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          format: "pdf",
          bytes: uploaded.bytes,
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

    console.error("Admin agricultural report PDF upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to upload the agricultural report PDF.",
      },
      { status: 500 }
    );
  }
}