import { NextResponse } from "next/server";

function assignmentDisabledResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Report assignment has been discontinued. Super Admins and Report Managers now handle all user reports.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return assignmentDisabledResponse();
}

export async function POST() {
  return assignmentDisabledResponse();
}
