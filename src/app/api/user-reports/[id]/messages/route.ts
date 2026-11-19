import { connection, NextRequest, NextResponse } from "next/server";

import { ObjectId } from "mongodb";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";

import { getCurrentAdmin } from "@/lib/admin-auth";

import { hasPermission } from "@/lib/admin-permissions";

import { getDatabase } from "@/lib/mongodb";

import { sendReportMessageEmail } from "@/lib/email";

import { sendSms } from "@/lib/sms";



type RouteContext = {

  params: Promise<{ id: string }>;

};



const messageSchema = z

 .object({

    message: z.string().trim().min(1).max(3000),

  })

 .strict();



type MessageDocument = {

  messageId: string;

  reportId: string;

  senderType: "user" | "admin";

  senderId: string;

  senderName: string;

  senderEmail: string;

  message: string;

  createdAt: Date;

};



const MESSAGE_RATE_LIMIT = 10;

const MESSAGE_RATE_WINDOW_MS = 15 * 60 * 1000;



let indexesPromise: Promise<void> | null = null;



function ensureMessageIndexes(

  db: Awaited<ReturnType<typeof getDatabase>>

): Promise<void> {

  if (!indexesPromise) {

    indexesPromise = Promise.all([

      db.collection("reportMessages").createIndex(

        { reportId: 1, createdAt: 1 },

        { name: "report_messages_conversation" }

      ),



      db.collection("reportMessageRateLimits").createIndex(

        { senderType: 1, senderId: 1, windowStart: 1 },

        {

          unique: true,

          name: "report_message_rate_limit_unique",

        }

      ),



      db.collection("reportMessageRateLimits").createIndex(

        { expiresAt: 1 },

        {

          expireAfterSeconds: 0,

          name: "report_message_rate_limit_ttl",

        }

      ),

    ]).then(() => undefined).catch((error) => {

      indexesPromise = null;

      throw error;

    });

  }



  return indexesPromise;

}



async function consumeMessageRateLimit(

  db: Awaited<ReturnType<typeof getDatabase>>,

  senderType: "user" | "admin",

  senderId: string,

  now: Date

): Promise<boolean> {

  const windowStart = new Date(

    Math.floor(now.getTime() / MESSAGE_RATE_WINDOW_MS) *

      MESSAGE_RATE_WINDOW_MS

  );



  const expiresAt = new Date(

    windowStart.getTime() +

      MESSAGE_RATE_WINDOW_MS +

      60 * 60 * 1000

  );



  const collection = db.collection("reportMessageRateLimits");



  const filter = {

    senderType,

    senderId,

    windowStart,

  };



  try {

    await collection.updateOne(

      filter,

      {

        $inc: { count: 1 },

        $setOnInsert: { expiresAt },

      },

      { upsert: true }

    );

  } catch (error) {

    // Handle simultaneous first messages creating the same

    // rate-limit record.

    if (

      error &&

      typeof error === "object" &&

      "code" in error &&

      error.code === 11000

    ) {

      await collection.updateOne(

        filter,

        { $inc: { count: 1 } }

      );

    } else {

      throw error;

    }

  }



  const record = await collection.findOne(filter);



  return (

    typeof record?.count === "number" &&

    record.count <= MESSAGE_RATE_LIMIT

  );

}



function unauthorizedResponse() {

  return NextResponse.json(

    {

      success: false,

      message: "Authentication required.",

    },

    { status: 401 }

  );

}



function forbiddenResponse() {

  return NextResponse.json(

    {

      success: false,

      message:

        "You do not have permission to access this conversation.",

    },

    { status: 403 }

  );

}



function invalidOriginResponse(request: NextRequest) {

  const origin = request.headers.get("origin");



  if (origin && origin !== request.nextUrl.origin) {

    return NextResponse.json(

      {

        success: false,

        message: "Invalid request origin.",

      },

      { status: 403 }

    );

  }



  return null;

}



function canAdminAccessMessages(

  admin: NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>

) {

  return (

    admin.role !== null &&

    hasPermission(admin.role, "view_all_reports") &&

    hasPermission(admin.role, "communicate_with_reporters")

  );

}



async function notifyConversationParticipants(
  report: {
    reportId: string;
    referenceNumber: string;
    reporter: {
      userId?: string;
      name?: string;
      email?: string;
    };
  },
  message: MessageDocument,
  adminSender: boolean
) {
  try {
    const db = await getDatabase();

    if (adminSender) {
      // Email notification to the reporter.
      const reporterEmail = report.reporter?.email;

      if (reporterEmail) {
        try {
          const result = await sendReportMessageEmail({
            to: reporterEmail,
            recipientName: report.reporter.name || "Reporter",
            senderName: message.senderName,
            senderType: "admin",
            referenceNumber: report.referenceNumber,
            message: message.message,
          });

          if (!result.success) {
            console.error(
              "Reporter notification email failed:",
              result.error
            );
          }
        } catch (error) {
          console.error("Reporter notification email error:", error);
        }
      } else {
        console.warn("[Report notification] Reporter email is missing.");
      }

      // SMS notification requires a verified phone number and explicit consent.
      const reporterUserId = report.reporter?.userId;
      const validReporterUserId = Boolean(
        reporterUserId && ObjectId.isValid(reporterUserId)
      );

      console.info("[Report SMS] Farmer lookup:", {
        reporterUserIdPresent: Boolean(reporterUserId),
        reporterUserIdValid: validReporterUserId,
      });

      if (!validReporterUserId) {
        console.warn(
          "[Report SMS] Farmer SMS skipped: reporter user ID is missing or is not a valid MongoDB ObjectId."
        );
        return;
      }

      try {
        const reporterProfile = await db.collection("users").findOne(
          { _id: new ObjectId(reporterUserId!) },
          {
            projection: {
              phone: 1,
              phoneVerified: 1,
              smsNotificationsEnabled: 1,
            },
          }
        );

        const phone = String(reporterProfile?.phone ?? "").trim();
        const phonePresent = phone.length > 0;
        const phoneVerified = reporterProfile?.phoneVerified === true;
        const smsConsentEnabled =
          reporterProfile?.smsNotificationsEnabled === true;
        const validGhanaPhone = /^\+233\d{9}$/.test(phone);
        const canReceiveSms =
          Boolean(reporterProfile) &&
          phoneVerified &&
          smsConsentEnabled &&
          validGhanaPhone;

        console.info("[Report SMS] Farmer recipient eligibility:", {
          profileFound: Boolean(reporterProfile),
          phonePresent,
          phoneVerified,
          smsConsentEnabled,
          validGhanaPhone,
          eligible: canReceiveSms,
        });

        if (!canReceiveSms) {
          console.warn(
            "[Report SMS] Farmer SMS skipped because the profile, phone verification, SMS consent, or phone format requirement was not satisfied."
          );
          return;
        }

        console.info("[Report SMS] Sending farmer notification.", {
          reportReference: report.referenceNumber,
        });

        const smsResult = await sendSms({
          recipient: phone,
          message:
            `AgriVanta: You have a new reply to report ` +
            `${report.referenceNumber}. Log in to your account to view the conversation.`,
        });

        if (!smsResult.success) {
          console.error(
            "[Report SMS] Farmer notification was not accepted:",
            smsResult.message
          );
        } else {
          console.info(
            "[Report SMS] Farmer notification was accepted by the SMS provider.",
            { reportReference: report.referenceNumber }
          );
        }
      } catch (error) {
        console.error("[Report SMS] Farmer notification error:", error);
      }

      return;
    }

    // Preserve existing email notifications to administrators.
    const administrators = await db
      .collection("administrators")
      .find(
        {
          status: "active",
          role: {
            $in: ["super_admin", "report_manager"],
          },
        },
        {
          projection: {
            _id: 0,
            name: 1,
            email: 1,
            phone: 1,
            phoneVerified: 1,
            smsNotificationsEnabled: 1,
          },
        }
      )
      .toArray();

    console.info("[Report SMS] Administrator recipients found:", {
      count: administrators.length,
      recipients: administrators.map((administrator) => {
        const phone = String(administrator.phone ?? "").trim();
        const phoneVerified = administrator.phoneVerified === true;
        const smsConsentEnabled =
          administrator.smsNotificationsEnabled === true;
        const validGhanaPhone = /^\+233\d{9}$/.test(phone);

        return {
          phonePresent: phone.length > 0,
          phoneVerified,
          smsConsentEnabled,
          validGhanaPhone,
          eligible:
            phoneVerified && smsConsentEnabled && validGhanaPhone,
        };
      }),
    });

    // Email notification to all active Super Admins and Report Managers.
    await Promise.all(
      administrators
        .filter(
          (administrator) =>
            typeof administrator.email === "string" &&
            administrator.email.trim().length > 0
        )
        .map(async (administrator) => {
          try {
            const result = await sendReportMessageEmail({
              to: String(administrator.email),
              recipientName: String(
                administrator.name || "Administrator"
              ),
              senderName: message.senderName,
              senderType: "user",
              referenceNumber: report.referenceNumber,
              message: message.message,
            });

            if (!result.success) {
              console.error(
                "Administrator notification email failed:",
                result.error
              );
            }
          } catch (error) {
            console.error("Administrator notification email error:", error);
          }
        })
    );

    // Send SMS only to administrators with verified phones and explicit consent.
    const eligibleAdministrators = administrators.filter((administrator) => {
      const phone = String(administrator.phone ?? "").trim();

      return (
        administrator.phoneVerified === true &&
        administrator.smsNotificationsEnabled === true &&
        /^\+233\d{9}$/.test(phone)
      );
    });

    if (eligibleAdministrators.length === 0) {
      console.warn(
        "[Report SMS] No administrators qualified for SMS notification."
      );
    }

    await Promise.all(
      eligibleAdministrators.map(async (administrator) => {
        try {
          const phone = String(administrator.phone).trim();

          console.info("[Report SMS] Sending administrator notification.", {
            reportReference: report.referenceNumber,
          });

          const smsResult = await sendSms({
            recipient: phone,
            message:
              `AgriVanta: A new message was posted to report ` +
              `${report.referenceNumber}. Log in to your admin account to view it.`,
          });

          if (!smsResult.success) {
            console.error(
              "[Report SMS] Administrator notification was not accepted:",
              smsResult.message
            );
          } else {
            console.info(
              "[Report SMS] Administrator notification was accepted by the SMS provider.",
              { reportReference: report.referenceNumber }
            );
          }
        } catch (error) {
          console.error(
            "[Report SMS] Administrator notification error:",
            error
          );
        }
      })
    );
  } catch (error) {
    // Notification failures must never undo a saved message.
    console.error("Report conversation notification error:", error);
  }
}

export async function GET(

  _request: NextRequest,

  { params }: RouteContext

) {

  await connection();



  try {

    const { id } = await params;



    if (!id || id.length > 100) {

      return NextResponse.json(

        { success: false, message: "Invalid report reference." },

        { status: 400 }

      );

    }



    const admin = await getCurrentAdmin();

    const user = admin ? null : await getCurrentUser();



    if (!admin && !user) {

      return unauthorizedResponse();

    }



    if (admin && !canAdminAccessMessages(admin)) {

      return forbiddenResponse();

    }



    const db = await getDatabase();



    await ensureMessageIndexes(db);



    const reportFilter = admin

      ? { reportId: id }

      : {

          reportId: id,

          "reporter.userId": user!.id,

        };



    const report = await db.collection("userReports").findOne(

      reportFilter,

      {

        projection: {

          _id: 0,

          reportId: 1,

        },

      }

    );



    if (!report) {

      return NextResponse.json(

        { success: false, message: "Report not found." },

        { status: 404 }

      );

    }



    const messages = await db

     .collection<MessageDocument>("reportMessages")

     .find({ reportId: id })

     .sort({ createdAt: -1 })

     .limit(100)

     .toArray();



    return NextResponse.json({

      success: true,

      messages: messages.reverse(),

    });

  } catch (error) {

    console.error("Report messages retrieval error:", error);



    return NextResponse.json(

      {

        success: false,

        message: "Unable to retrieve this conversation.",

      },

      { status: 500 }

    );

  }

}



export async function POST(

  request: NextRequest,

  { params }: RouteContext

) {

  await connection();



  try {

    const originError = invalidOriginResponse(request);



    if (originError) {

      return originError;

    }



    const { id } = await params;



    if (!id || id.length > 100) {

      return NextResponse.json(

        { success: false, message: "Invalid report reference." },

        { status: 400 }

      );

    }



    const admin = await getCurrentAdmin();

    const user = admin ? null : await getCurrentUser();



    if (!admin && !user) {

      return unauthorizedResponse();

    }



    if (admin && !canAdminAccessMessages(admin)) {

      return forbiddenResponse();

    }



    let body: unknown;



    try {

      body = await request.json();

    } catch {

      return NextResponse.json(

        {

          success: false,

          message: "Invalid JSON request body.",

        },

        { status: 400 }

      );

    }



    const validation = messageSchema.safeParse(body);



    if (!validation.success) {

      return NextResponse.json(

        {

          success: false,

          message:

            "Enter a message between 1 and 3,000 characters.",

          errors: validation.error.flatten(),

        },

        { status: 400 }

      );

    }



    const db = await getDatabase();



    await ensureMessageIndexes(db);



    const reportFilter = admin

      ? { reportId: id }

      : {

          reportId: id,

          "reporter.userId": user!.id,

        };



    const report = await db.collection("userReports").findOne(

      reportFilter,

      {

        projection: {

          _id: 0,

          reportId: 1,

          referenceNumber: 1,

          reporter: 1,

        },

      }

    );



    if (!report) {

      return NextResponse.json(

        { success: false, message: "Report not found." },

        { status: 404 }

      );

    }



    const now = new Date();



    const senderType = admin ? "admin" : "user";

    const senderId = admin ? admin.id : user!.id;



    const withinLimit = await consumeMessageRateLimit(

      db,

      senderType,

      senderId,

      now

    );



    if (!withinLimit) {

      return NextResponse.json(

        {

          success: false,

          message:

            "You have sent too many messages. Please try again after 15 minutes.",

        },

        { status: 429 }

      );

    }



    const newMessage: MessageDocument = {

      messageId: randomUUID(),

      reportId: id,

      senderType,

      senderId,

      senderName: admin ? admin.name : user!.name,

      senderEmail: admin ? admin.email : user!.email,

      message: validation.data.message,

      createdAt: now,

    };



    await db

     .collection<MessageDocument>("reportMessages")

     .insertOne(newMessage);



    await db.collection("userReports").updateOne(

      { reportId: id },

      {

        $set: {

          updatedAt: now,

        },

      }

    );



    // Email notifications are best-effort.

    // Message storage does not depend on email delivery.

    await notifyConversationParticipants(

      {

        reportId: report.reportId,

        referenceNumber: report.referenceNumber,

        reporter: report.reporter,

      },

      newMessage,

      Boolean(admin)

    );



    return NextResponse.json(

      {

        success: true,

        message: "Message sent successfully.",

        newMessage,

      },

      { status: 201 }

    );

  } catch (error) {

    console.error("Report message sending error:", error);



    return NextResponse.json(

      {

        success: false,

        message: "Unable to send your message. Please try again.",

      },

      { status: 500 }

    );

  }

}
