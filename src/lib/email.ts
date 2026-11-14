
import { Resend } from "resend";

type ReportResponseEmail = {
  to: string;
  userName: string;
  referenceNumber: string;
  responseMessage: string;
};

type ReportMessageEmail = {
  to: string;
  recipientName: string;
  senderName: string;
  senderType: "user" | "admin";
  referenceNumber: string;
  message: string;
};

type EmailResult =
  | { success: true; emailId?: string }
  | { success: false; error: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

async function sendEmail(
  options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error("Email configuration is missing.");
    return {
      success: false,
      error: "Email service is not configured.",
    };
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      console.error("Resend email error:", error);

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Failed to send email:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown email error.",
    };
  }
}

/**
 * Sends an official report response notification.
 * Kept for compatibility with the existing report workflow.
 */
export async function sendReportResponseEmail({
  to,
  userName,
  referenceNumber,
  responseMessage,
}: ReportResponseEmail): Promise<EmailResult> {
  const safeName = escapeHtml(userName);
  const safeReference = escapeHtml(referenceNumber);
  const safeMessage = escapeHtml(responseMessage);

  return sendEmail({
    to,
    subject: `AgriVanta has responded to your report (${referenceNumber})`,
    text: [
      `Hello ${userName},`,
      "",
      "Our team has reviewed your report and sent you an official response.",
      "",
      `Report reference: ${referenceNumber}`,
      "",
      "Administrator's response:",
      responseMessage,
      "",
      "Please log in to your AgriVanta account to view your report and any further updates.",
      "",
      "Regards,",
      "AgriVanta Support Team",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#26352b;line-height:1.6;">
        <div style="background:#17472D;padding:24px;color:white;">
          <h2 style="margin:0;">AgriVanta</h2>
          <p style="margin:6px 0 0;">Agriculture Connected</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;">
          <h2>Hello ${safeName},</h2>
          <p>Our team has reviewed your report and sent you an official response.</p>
          <p><strong>Report reference:</strong> ${safeReference}</p>
          <div style="background:#f8f6ee;border-left:4px solid #17472D;padding:16px;margin:20px 0;">
            <strong>Administrator's response</strong>
            <p style="white-space:pre-wrap;">${safeMessage}</p>
          </div>
          <p>Please log in to your AgriVanta account to view your report and any further updates.</p>
          <p>Regards,<br/><strong>AgriVanta Support Team</strong></p>
        </div>
      </div>
    `,
  });
}

/**
 * Sends a notification when either party sends a report message.
 */
export async function sendReportMessageEmail({
  to,
  recipientName,
  senderName,
  senderType,
  referenceNumber,
  message,
}: ReportMessageEmail): Promise<EmailResult> {
  const isAdminMessage = senderType === "admin";

  const subject = isAdminMessage
    ? `New response to your AgriVanta report (${referenceNumber})`
    : `New reporter message on AgriVanta report (${referenceNumber})`;

  const safeRecipient = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeReference = escapeHtml(referenceNumber);
  const safeMessage = escapeHtml(message);

  const intro = isAdminMessage
    ? "An administrator has sent you a new message about your report."
    : "A reporter has sent a new message about a report.";

  const text = [
    `Hello ${recipientName},`,
    "",
    intro,
    "",
    `Report reference: ${referenceNumber}`,
    `From: ${senderName}`,
    "",
    message,
    "",
    "Please log in to AgriVanta to view the conversation and reply.",
    "",
    "AgriVanta Support Team",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#26352b;line-height:1.6;">
      <div style="background:#17472D;padding:24px;color:white;">
        <h2 style="margin:0;">AgriVanta</h2>
        <p style="margin:6px 0 0;">Agriculture Connected</p>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;">
        <h2>Hello ${safeRecipient},</h2>
        <p>${intro}</p>
        <p><strong>Report reference:</strong> ${safeReference}</p>
        <p><strong>From:</strong> ${safeSender}</p>
        <div style="background:#f8f6ee;border-left:4px solid #17472D;padding:16px;margin:20px 0;">
          <strong>New message</strong>
          <p style="white-space:pre-wrap;">${safeMessage}</p>
        </div>
        <p>Please log in to AgriVanta to view the conversation and reply.</p>
        <p>Regards,<br/><strong>AgriVanta Support Team</strong></p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}


/**
 * Sends an authentication verification or password recovery code.
 */
export async function sendAuthVerificationEmail({
  to,
  userName,
  code,
  purpose,
}: {
  to: string;
  userName: string;
  code: string;
  purpose: "registration" | "password-reset";
}): Promise<EmailResult> {
  const safeName = escapeHtml(userName);
  const safeCode = escapeHtml(code);

  const isRegistration = purpose === "registration";

  const subject = isRegistration
    ? "Verify your AgriVanta account"
    : "Your AgriVanta password reset code";

  const heading = isRegistration
    ? "Verify your email address"
    : "Reset your password";

  const description = isRegistration
    ? "Use the verification code below to verify your email address and activate your AgriVanta account."
    : "Use the code below to continue resetting your AgriVanta password.";

  return sendEmail({
    to,
    subject,
    text: [
      `Hello ${userName},`,
      "",
      description,
      "",
      `Your verification code is: ${code}`,
      "",
      "This code expires in 5 minutes.",
      "Do not share this code with anyone.",
      "",
      "AgriVanta Support Team",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#26352b;line-height:1.6;">
        <div style="background:#17472D;padding:24px;color:white;">
          <h2 style="margin:0;">AgriVanta</h2>
          <p style="margin:6px 0 0;">Agriculture Connected</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;">
          <h2>Hello ${safeName},</h2>
          <h3>${heading}</h3>
          <p>${description}</p>
          <div style="background:#f8f6ee;border:1px solid #e5e7eb;padding:20px;text-align:center;margin:24px 0;">
            <p style="margin:0 0 8px;color:#718071;">Your verification code</p>
            <strong style="font-size:32px;letter-spacing:8px;color:#17472D;">${safeCode}</strong>
          </div>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p>Do not share this code with anyone.</p>
          <p>Regards,<br/><strong>AgriVanta Support Team</strong></p>
        </div>
      </div>
    `,
  });
}
